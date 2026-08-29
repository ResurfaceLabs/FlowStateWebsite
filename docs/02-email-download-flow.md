# Email + Download + Share Flow

This is the one part of the site with real external side-effects. Read this whole doc before implementing any of it — the pieces depend on each other in a specific order.

## The flow, end to end

1. The moment the page loads, a visit is logged (see "Traffic-source tracking & visit log" below) — no user action required.
2. User clicks the hero CTA ("Download for macOS" or whatever `docs/04-copy.md` lands on).
3. An inline panel/modal appears asking for their email, with a submit button (e.g. "Download") and, directly below it, a **Skip** link/button — same row or immediately under, visually de-emphasized (lower opacity, smaller, no button chrome — a text link, not a button).
4. Both paths look up the visitor's country (see "Country capture" below) — this happens unconditionally, on every download trigger, regardless of whether an email was given:
   - **User submits an email:** basic format validation (see below) → on pass, look up country → log the download to Google Sheets with email + country + source (fire-and-forget, not awaited) → trigger the `.dmg` download → show the share toast.
   - **User clicks Skip:** no email captured → look up country → log the download to Google Sheets with blank email, populated country + source (fire-and-forget, not awaited) → trigger the `.dmg` download directly → show the share toast.
5. **Every download is logged, on both paths.** Only the Email field differs — populated on the email path, blank on the skip path. Country is now populated on both paths. The Downloads tab row count is therefore the true total download count; a non-blank Email column is simply how many of those rows included an email. There's no separate "how many emails did we collect" number to reconcile — it's a filter on the same tab.
6. **The download must never wait on the Sheets POST.** These are two independent actions that happen to be triggered by the same click. If the POST is slow, fails, or is blocked by an ad-blocker, the download still fires immediately. Losing an email (or a download log row) silently is an acceptable failure mode. Making the user wait for a download because of a network call to a Google service is not.
7. The moment the download fires, show the "Share on X" toast (see below).

## Traffic-source tracking & visit log

The site reads a `src` query parameter (e.g. `?src=x.com`, `?src=hackernews`, `?src=producthunt`) to know where traffic came from. If there's no `src` param at all, the source defaults to the string `'direct'`.

```ts
function getSourceParam(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('src') || 'direct';
}
```

This is read **once**, at page-load, near the top of the page component, and the resulting value is stored and reused everywhere else in this flow — it is never re-read from `window.location.search` at click-time. The source a visitor arrived from is fixed the moment they land; it shouldn't change based on what they do on the page afterward.

Separately from (and unconditionally of) any email/download activity, a `visit` row is logged exactly once per page load, with **Country** alongside Timestamp and Source:

```ts
function logVisit(source: string, country: string): void {
  if (!GOOGLE_SHEETS_ENDPOINT) return;

  const body = new URLSearchParams({ type: 'visit', source, country });

  fetch(GOOGLE_SHEETS_ENDPOINT, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  }).catch(() => {});
}
```

`logVisit(source, country)` is called once on initial mount (e.g. a `useEffect` with an empty dependency array) — not on every re-render, and not tied to any button click. Same fire-and-forget philosophy as the download log: never awaited by its caller, failures silently swallowed.

Getting `country` means this effect must `await getCountry()` (the same lookup used on the download paths) before it can build and send the POST — the visit-logging effect is therefore async, unlike its original synchronous form. This introduces a small, invisible delay between page-load and the visit POST firing; nothing on screen depends on it, so it's an accepted tradeoff, not a regression. If `getCountry()` fails (network error, ad-blocker, anything), it resolves to an empty string per its existing fail-quiet design — the visit is still logged, just with a blank Country field. The visit must never be silently dropped because the country lookup failed.

**Guarding against React Strict Mode's double-invocation — this now interacts with the async change above:** in development, Strict Mode deliberately invokes mount-time effects twice as a way of surfacing side-effect bugs (this does not happen in production builds). Without a guard, this would produce two `visit` rows per page load in dev. The fix is a ref that survives across the double-call within the same mount:

```ts
const hasLoggedVisit = useRef(false);

useEffect(() => {
  if (hasLoggedVisit.current) return;
  hasLoggedVisit.current = true; // set BEFORE the await below — see note

  (async () => {
    const country = await getCountry();
    logVisit(source, country);
  })();
}, []);
```

**The guard flag must be set synchronously, on the first line of work inside the effect, before any `await`.** Now that the effect does async work (awaiting `getCountry()`), setting the flag after that `await` would reopen the exact race this guard exists to close: while the first invocation is still waiting on the country lookup, Strict Mode's second invocation would run, see the flag still unset, and pass through — producing two visit rows again, just via a different path than the original bug. Setting the flag first, before the async work starts, closes that window regardless of how long the lookup takes.

This is a deliberate, permanent part of the implementation — not a workaround to later "clean up." Don't remove it under the assumption that the duplicate only appeared once, don't move the flag-set after the `await` "to be safe" (that's precisely what reintroduces the race), and don't replace it with Strict-Mode detection or a `NODE_ENV` check; the ref guard is correct in both dev and production and doesn't depend on knowing which environment it's running in.

## Country capture — what and why

On every page load, and on every download trigger — whether or not an email was given — the site also captures the visitor's **country only** — never IP address, never city — and sends it to the same Google Sheets endpoint.

This is a deliberate line, not an oversight. FlowState's core pitch is "nothing leaves your Mac, we don't track you" — collecting IP or city-level location on the landing page would sit awkwardly next to that promise, even though the marketing site is a separate system from the app itself. Country-level is a considered compromise: useful for knowing roughly where visits and downloads are coming from, without crossing into anything that reads as tracking a specific person. If this flow is ever rebuilt from scratch, that boundary should be preserved — don't add IP or city collection just because the country field already exists.

Country is looked up via a free, keyless API (`ipapi.co`) at two moments: once on page load (feeding the visit log) and once on every download trigger (feeding the download log, on both the email and Skip paths). Nothing about either kind of lookup is visible in the UI — it's exactly as invisible/backend-only as the email capture itself. Country capture is tied to "did a page load or a download happen," not "was an email given" — an earlier version of this flow only looked up country on the email-submit download path; that asymmetry no longer exists anywhere in this flow.

## Email validation

Keep this minimal — it's a lead-gen field, not an auth system.

```ts
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
```

If it fails: show an inline error under the field, don't clear what they typed, don't block them from just clicking Skip instead. Don't add deliverability checking, MX record lookups, or any third-party validation service — that's overkill for this.

## The Google Sheets integration (Apps Script)

This is the free, backend-less way to collect visits and downloads into a Google Sheet. Setup is one-time, done in the Google Sheets UI, not in this codebase — but the code that receives the request lives in Apps Script.

The sheet has **two tabs**: "Visits" and "Downloads". A single Apps Script endpoint receives both kinds of POST and routes each row to the correct tab based on a `type` field (`'visit'` or `'download'`) sent in the request body. This is deliberately two types going to two tabs — not a third type or tab.

**Note:** the Sheet and the Apps Script deployed to it are maintained manually in the Google Sheets UI (script.google.com), not in this codebase. This doc describes the resulting behavior for context, but the codebase itself has no access to the Sheet or the script and no automated way to push changes to either.

- **Visits tab** — one row per page load, columns roughly `Timestamp | Source | Country`. Logged unconditionally, regardless of any download activity. Country may be blank if the lookup failed — the visit is still logged either way.
- **Downloads tab** — one row per download trigger (email path or Skip path), columns roughly `Timestamp | Email | Country | Source`. Only Email is blank on the Skip path — Country is populated on both paths. Row count on this tab is the true total download count; a non-blank Email column is a filter on that same count, not a separate figure.

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

### The fetch calls (this lives in the site's code)

`logDownload` is the renamed, extended form of what used to be `submitEmailInBackground` — it now fires on **both** the email-submit and Skip paths (with blank `email`/`country` on Skip), and includes `type: 'download'` plus `source` so the Apps Script can route it and attribute it:

```ts
const GOOGLE_SHEETS_ENDPOINT = import.meta.env.VITE_SHEETS_ENDPOINT || '';

function logDownload(email: string, country: string, source: string): void {
  if (!GOOGLE_SHEETS_ENDPOINT) return; // not configured yet — fail silently, don't block anything

  const body = new URLSearchParams({ type: 'download', email, country, source });

  fetch(GOOGLE_SHEETS_ENDPOINT, {
    method: 'POST',
    mode: 'no-cors', // required: Google doesn't return CORS headers, so this is the only way to POST cross-origin here
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  }).catch(() => {
    // intentionally swallowed — see doc: losing a log row is fine, blocking a download is not
  });
  // deliberately NOT awaited by the caller — see below
}
```

`logVisit` (see "Traffic-source tracking & visit log" above) follows the identical `no-cors`/fire-and-forget pattern with `type: 'visit'`, `source`, and `country` in the body — no email involved, but country is now included, resolved from `getCountry()` before this POST is built.

**Why `mode: 'no-cors'`:** Apps Script web app responses don't include CORS headers that would let `fetch` read the response from a different origin (your site's domain vs. `script.google.com`). `no-cors` mode lets the request go out and Google still receives and processes it (the row still gets appended), but JavaScript can't read anything back — the response is opaque. This means: **no visible success/failure state in the UI for either of these calls.** That's an accepted tradeoff, not a bug — see the flow description above for why.

**Why the country lookup is awaited but the Sheets POST isn't:** the calling code should look like this —

```ts
async function handleDownloadClick(email: string | null, source: string): Promise<void> {
  const country = await getCountry(); // now called on both paths — safe to await, always resolves
  if (email) {
    logDownload(email, country, source);
  } else {
    logDownload('', country, source); // skip path — still no email, but country is now captured
  }
  triggerDownload(); // happens immediately regardless, on both branches
  showShareToast();
}
```

`getCountry()` is safe to `await` because its `catch` guarantees it always resolves to a value (empty string on failure) rather than throwing or rejecting — this is why it's now safe to call unconditionally on every download trigger, not just the email path. `logDownload()` must stay un-awaited on both branches exactly as before — awaiting the country lookup only adds the lookup's own bounded network latency before the download fires, which is an accepted tradeoff on both paths now; awaiting the Sheets POST as well would additionally tie the download to a second, unrelated network call for no benefit. This constraint holds even under a slow or hanging `getCountry()` call, since it always resolves and never hangs indefinitely — but `logDownload()` and `triggerDownload()` must still never be made to wait on the Sheets POST itself.

`source` itself is never re-derived inside this handler — it's passed in from the value `getSourceParam()` produced once at page-load (see above).

Not like this:

```ts
// DON'T DO THIS — this makes the download wait on the Sheets POST too
async function handleDownloadClick(email: string | null, source: string) {
  const country = await getCountry();
  if (email) {
    await logDownload(email, country, source); // wrong — blocks the download
  }
  triggerDownload();
}
```

### Where this lives in code

- `GOOGLE_SHEETS_ENDPOINT` should be an env var (`VITE_SHEETS_ENDPOINT`), not hardcoded — put a placeholder in `.env.example` and leave `.env` gitignored. Until the user sets this, `logDownload` and `logVisit` should no-op silently (see the early return in the code above) rather than throwing — the site should work fine with zero rows being collected if this isn't configured yet.
- `getCountry()` needs no env var or API key — `ipapi.co`'s JSON endpoint is called directly and anonymously. It lives alongside `logDownload`, `logVisit`, `getSourceParam`, and `triggerDownload`, not inside a component body.

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
- The fire-and-forget POSTs to Apps Script: standard pattern for exactly this use case (free visit/email/download collection, no backend). The `no-cors` + non-awaited combination is the whole trick, used identically for both `logVisit` and `logDownload`.
- Two POST "types" (`visit`, `download`) hit the same endpoint and are routed by the Apps Script to two tabs (Visits, Downloads) based on a `type` field — not a client-side concern beyond including that field in the body.
- The visit log: fires once per page load, unconditionally, with source, country, and timestamp — no email, no user action required. Guarded with a `useRef` flag against React Strict Mode's dev-only double-invocation of mount effects, so it fires exactly once even in dev — see "Traffic-source tracking & visit log" above. The flag is set synchronously, before the `await getCountry()` inside the effect, precisely so the async work doesn't reopen the double-invocation race the guard exists to close.
- The download log: fires on every download trigger, both the email-submit and Skip paths — Skip sends blank email but a populated country. This makes the Downloads tab row count the true total download count, with a non-blank Email column as a filter on it rather than a separate number to reconcile.
- `getSourceParam()`: read exactly once, at page-load, and threaded through to both `logVisit` and `logDownload` — never re-read from `window.location.search` at click-time, since the arriving source is fixed the moment the page loads.
- The country lookup: a single awaited call to a free, keyless API that can never throw or reject — see "Country capture" above for why country-only, and why IP/city are deliberately out of scope. Called on page load (feeding the visit log) and unconditionally on every download trigger (both paths), not only when an email is present. A failed lookup resolves to an empty string rather than dropping the visit or download row it's attached to.
- The download-never-waits constraint: this is the one thing to actively guard against getting wrong — it's easy to accidentally `await` a Sheets POST "to be safe" and that's precisely the wrong instinct here. Awaiting the country lookup is fine (and necessary, since it needs to be in the POST body); awaiting either Sheets POST itself is not.
- The share toast: standard toast/banner UI, triggered by a plain click handler on the X intent URL.
