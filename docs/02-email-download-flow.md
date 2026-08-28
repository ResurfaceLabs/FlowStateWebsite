# Email + Download + Share Flow

This is the one part of the site with real external side-effects. Read this whole doc before implementing any of it — the pieces depend on each other in a specific order.

## The flow, end to end

1. User clicks the hero CTA ("Download for macOS" or whatever `docs/04-copy.md` lands on).
2. An inline panel/modal appears asking for their email, with a submit button (e.g. "Download") and, directly below it, a **Skip** link/button — same row or immediately under, visually de-emphasized (lower opacity, smaller, no button chrome — a text link, not a button).
3. Two ways forward from here:
   - **User submits an email:** basic format validation (see below) → on pass, look up the visitor's country (see "Country capture" below) → fire the background POST to Google Sheets with email + country (fire-and-forget, not awaited) → trigger the `.dmg` download → show the share toast.
   - **User clicks Skip:** no email captured, no country lookup, no POST fired → trigger the `.dmg` download directly → show the share toast.
4. **The download must never wait on the Sheets POST.** These are two independent actions that happen to be triggered by the same click. If the POST is slow, fails, or is blocked by an ad-blocker, the download still fires immediately. Losing an email silently is an acceptable failure mode. Making the user wait for a download because of a network call to a Google service is not.
5. The moment the download fires, show the "Share on X" toast (see below).

## Country capture — what and why

Alongside the email, the site also captures the visitor's **country only** — never IP address, never city — and sends it to the same Google Sheets endpoint.

This is a deliberate line, not an oversight. FlowState's core pitch is "nothing leaves your Mac, we don't track you" — collecting IP or city-level location on the landing page would sit awkwardly next to that promise, even though the marketing site is a separate system from the app itself. Country-level is a considered compromise: useful for knowing roughly where downloads are coming from, without crossing into anything that reads as tracking a specific person. If this flow is ever rebuilt from scratch, that boundary should be preserved — don't add IP or city collection just because the country field already exists.

Country is looked up via a free, keyless API (`ipapi.co`) at the moment of email submission — no lookup happens on page load, and nothing about it is visible in the UI. It's exactly as invisible/backend-only as the email capture itself.

## Email validation

Keep this minimal — it's a lead-gen field, not an auth system.

```ts
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
```

If it fails: show an inline error under the field, don't clear what they typed, don't block them from just clicking Skip instead. Don't add deliverability checking, MX record lookups, or any third-party validation service — that's overkill for this.

## The Google Sheets integration (Apps Script)

This is the free, backend-less way to collect emails into a Google Sheet. Setup is one-time, done in the Google Sheets UI, not in this codebase — but the code that receives the request lives in Apps Script and is included below so it can be pasted in directly.

### One-time setup (do this in the browser, not in Claude Code)

1. Create a new Google Sheet. Name it something like "FlowState Emails."
2. In the sheet, go to **Extensions → Apps Script**. This opens a script editor tied to that sheet.
3. Delete the placeholder code and paste in the script below.
4. Click **Deploy → New deployment**. Select type **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Deploy. Google will give you a URL like `https://script.google.com/macros/s/AKfycb.../exec` — this is the endpoint the site POSTs to.
6. Copy that URL into the site's env config (see "Where this lives in code" below).
7. The first row of the sheet should be a header row: `Timestamp | Email | Country`. The script below appends to whatever sheet is active, so make sure this is the only sheet in the spreadsheet, or adjust `getActiveSheet()` to target a specific sheet by name if there are multiple tabs.

### The Apps Script code (paste into script.google.com)

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var email = e.parameter.email || '';
  var country = e.parameter.country || '';

  if (email) {
    sheet.appendRow([new Date(), email, country]);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

This reads `email` and `country` from the POST body's form-encoded parameters (not JSON — see the fetch code below, it sends `application/x-www-form-urlencoded` on purpose, because that's what Apps Script parses into `e.parameter` without extra config). Appends a row with a timestamp, the email, and the country. Returns a small JSON confirmation — though note the site will never read this response (see below), so this return value is really just good practice for if you ever test the endpoint directly.

**Note:** this Apps Script is maintained manually in the Google Sheets UI (script.google.com), not in this codebase — this doc is the source of truth for what should be deployed there, but the codebase itself has no access to it and no automated way to push changes.

### The country lookup (this lives in the site's code)

```ts
async function getCountry(): Promise<string> {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    return data.country_name || '';
  } catch {
    return ''; // must fail quietly — this can never throw or hang the caller
  }
}
```

`ipapi.co` is a free, keyless API — no `.env` variable or API key needed for this call, unlike the Sheets endpoint. On any failure (network error, bad response, anything) it resolves to an empty string rather than throwing, so the caller can safely `await` it without a `try/catch` of its own.

### The fetch call (this lives in the site's code)

```ts
const GOOGLE_SHEETS_ENDPOINT = import.meta.env.VITE_SHEETS_ENDPOINT || '';

function submitEmailInBackground(email: string, country: string): void {
  if (!GOOGLE_SHEETS_ENDPOINT) return; // not configured yet — fail silently, don't block anything

  const body = new URLSearchParams({ email, country });

  fetch(GOOGLE_SHEETS_ENDPOINT, {
    method: 'POST',
    mode: 'no-cors', // required: Google doesn't return CORS headers, so this is the only way to POST cross-origin here
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  }).catch(() => {
    // intentionally swallowed — see doc: losing an email is fine, blocking a download is not
  });
  // deliberately NOT awaited by the caller — see below
}
```

**Why `mode: 'no-cors'`:** Apps Script web app responses don't include CORS headers that would let `fetch` read the response from a different origin (your site's domain vs. `script.google.com`). `no-cors` mode lets the request go out and Google still receives and processes it (the row still gets appended), but JavaScript can't read anything back — the response is opaque. This means: **no visible success/failure state in the UI for this specific call.** That's an accepted tradeoff, not a bug — see the flow description above for why.

**Why the country lookup is awaited but the Sheets POST isn't:** the calling code should look like this —

```ts
async function handleDownloadClick(email: string | null): Promise<void> {
  if (email) {
    const country = await getCountry(); // safe to await — always resolves, never throws
    submitEmailInBackground(email, country); // stays fire-and-forget, NOT awaited
  }
  triggerDownload(); // happens immediately regardless
  showShareToast();
}
```

`getCountry()` is safe to `await` because its `catch` guarantees it always resolves to a value (empty string on failure) rather than throwing or rejecting. `submitEmailInBackground()` must stay un-awaited exactly as before — awaiting the country lookup only adds the lookup's own bounded network latency before the download fires, which is an accepted tradeoff; awaiting the Sheets POST as well would additionally tie the download to a second, unrelated network call for no benefit.

Not like this:

```ts
// DON'T DO THIS — this makes the download wait on the Sheets POST too
async function handleDownloadClick(email: string | null) {
  if (email) {
    const country = await getCountry();
    await submitEmailInBackground(email, country); // wrong — blocks the download
  }
  triggerDownload();
}
```

### Where this lives in code

- `GOOGLE_SHEETS_ENDPOINT` should be an env var (`VITE_SHEETS_ENDPOINT`), not hardcoded — put a placeholder in `.env.example` and leave `.env` gitignored. Until the user sets this, `submitEmailInBackground` should no-op silently (see the early return in the code above) rather than throwing — the site should work fine with zero emails being collected if this isn't configured yet.
- `getCountry()` needs no env var or API key — `ipapi.co`'s JSON endpoint is called directly and anonymously. It lives alongside `submitEmailInBackground` and `triggerDownload`, not inside a component body.

## Triggering the download

```ts
const DMG_PATH = '/downloads/FlowState.dmg';

function triggerDownload(): void {
  const link = document.createElement('a');
  link.href = DMG_PATH;
  link.download = 'FlowState.dmg';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

`DMG_PATH` is a constant, not conditional logic. The file at `public/downloads/FlowState.dmg` starts as an empty/dummy placeholder (see `docs/03-assets.md`) and the user will drop the real build in later at the exact same path — no code changes needed when that happens.

## The "Share on X" toast

After `triggerDownload()` fires (whether the user submitted an email or skipped), show an in-page toast/card. Not a popup, not auto-opened.

- Appears in a corner (bottom-right is a reasonable default) or as a slide-in banner — pick whatever fits the existing motion/animation language of the page (Framer Motion, consistent with the entrance animations elsewhere).
- Contains: a short line of copy (see `docs/04-copy.md`) + a "Share on X" button.
- Clicking the button opens this URL in a new tab (`window.open(url, '_blank')`):

```
https://x.com/intent/post?text=Just%20found%20Flow%20State%20—%20free%2C%20fully%20offline%20dictation%20for%20macOS&url=https://flowstate.vansh.wtf
```

- The toast should be dismissible (a close button, or auto-dismiss after ~8-10 seconds — either is fine, pick one and keep it simple).
- Do NOT auto-open the X intent link. The user clicks the button; nothing opens on its own.

## Summary of what's genuinely custom here vs. what's a standard pattern

- The email form + skip link: standard UI, nothing unusual.
- The fire-and-forget POST to Apps Script: standard pattern for exactly this use case (free email collection, no backend). The `no-cors` + non-awaited combination is the whole trick.
- The country lookup: a single awaited call to a free, keyless API that can never throw or reject — see "Country capture" above for why country-only, and why IP/city are deliberately out of scope.
- The download-never-waits constraint: this is the one thing to actively guard against getting wrong — it's easy to accidentally `await` the Sheets POST "to be safe" and that's precisely the wrong instinct here. Awaiting the country lookup is fine (and necessary, since it needs to be in the POST body); awaiting the Sheets POST itself is not.
- The share toast: standard toast/banner UI, triggered by a plain click handler on the X intent URL.
