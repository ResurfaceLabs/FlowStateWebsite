# CLAUDE.md — FlowState Landing Page

This file is the entry point for building the FlowState marketing site. Read this first, then pull in `docs/*.md` files as needed for the section you're working on.

## What we're building

**FlowState** is an offline-first macOS dictation app — think "WhisprFlow, but it never touches a server." Audio and transcripts never leave the user's machine. This is the single most important selling point and should be reflected in copy, not just mentioned once.

The site is a **single-section landing page** (Hero only — no testimonial, no features grid, no pricing). It is a close visual/structural port of a reference design ("Neuralyn," an analytics SaaS), with these substitutions:

- Dashboard screenshot → FlowState demo video (recorded by the user post-build, placeholder video for now)
- Dashboard's translucent card + parallax → simplified: video card, no `mixBlendMode: luminosity` trick, no dashboard parallax
- Added: a dark botanical/foliage background image behind the video (see `docs/03-assets.md`)
- "Sign In" button → GitHub icon link (`href="#"` placeholder, user will wire up later)
- Testimonial section (Section 2 in the reference) → **cut entirely**

Read `docs/01-reference-design.md` before writing any component — it has the full original spec this is based on, including exact Tailwind classes, animation timings, and the `liquid-glass` CSS.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- Framer Motion (all entrance/scroll animations)
- shadcn/ui (only where it's a natural fit — this is a small single-page site, don't over-import)
- Fonts: `@fontsource/inter` (400/500/600/700), `@fontsource/instrument-serif` (400, 400-italic)

No backend. No database. No auth. This is a static site with one external side-effect (see below).

## The three things that make this site not-trivial

Everything else is a straight port of the reference design. These three are custom to FlowState and deserve care:

### 1. Email-gated download flow
Click "Get FlowState" → inline email capture (with a faded "Skip" option directly below) → on submit *or* skip, download starts immediately AND (if email was given) a background fire-and-forget POST goes to a Google Apps Script endpoint that appends the email to a Google Sheet.

**Critical constraint: the download must never wait on the network request.** The Sheets POST is fire-and-forget, uses `mode: 'no-cors'`, and is never `await`ed before triggering the download. If the request fails silently (adblocker, offline, whatever), the user still gets their download. Losing an email is an acceptable failure; blocking a download is not.

Full spec, exact code, and Apps Script setup instructions: `docs/02-email-download-flow.md`

### 2. Post-download "Share on X" toast
The instant the download fires, show an in-page toast/card (not a popup, not auto-opened in a new tab) with a "Share on X" button. Clicking it opens the pre-filled X intent URL in a new tab. This is a passive nudge, not a blocking modal — user can dismiss it or ignore it and it goes away.

Exact copy, X intent URL, and toast behavior: `docs/02-email-download-flow.md`

### 3. The layered hero background
Reference design has a translucent dashboard card floating over the page. Ours is simpler but has one nuance worth getting right: **the botanical foliage image sits behind the video, not full-bleed behind the whole page.** It's bottom-anchored, spans the width of the hero's dashboard/video area (not the full page width), and the video card sits on top of it, partially overlapping its edges. Get the z-index stack wrong and it either disappears behind the video or floats weirdly above it.

Exact layering, z-index order, and positioning: `docs/03-assets.md`

## Copy

All hero copy is placeholder — headline, subtext, button labels, everything. It's written to be directionally correct (offline, private, macOS, dictation) but is explicitly meant to be edited. Don't treat any string in `docs/04-copy.md` as final; treat the *structure* (what needs a headline vs. what needs a one-liner) as final.

## What NOT to build

- No pricing section, no FAQ, no footer beyond what's strictly needed
- No real auth — the GitHub button is `href="#"`, do not add a login flow
- No real `.dmg` — download points to `/public/downloads/FlowState.dmg`, which will be an empty/dummy file until the user replaces it. Don't add conditional "coming soon" logic; the link should just always point there.
- No testimonial section, no second scroll section, no dashboard parallax
- Don't build multi-page routing — this is one page

## File-by-file reference

- `docs/01-reference-design.md` — the original design spec this is ported from (fonts, colors, exact Tailwind classes, animation timings, `liquid-glass` CSS, navbar/hero structure)
- `docs/02-email-download-flow.md` — email capture UI, Google Apps Script code (copy-paste ready), fire-and-forget fetch pattern, X share toast
- `docs/03-assets.md` — full asset list, specs for each (dimensions, format, where AI-generation is expected vs. user-provided), hero layering/z-index details
- `docs/04-copy.md` — placeholder copy for every text element on the page
- `docs/05-build-checklist.md` — suggested build order, so Claude Code doesn't have to invent a sequencing strategy

## Quick answers to things you might otherwise stop and ask about

- **Video autoplay?** Yes, muted, loop, `playsInline`, matching the reference video's behavior — this is a straight port of that piece.
- **Mobile nav links** — hidden on mobile in the reference (no hamburger menu specified). Keep it that way; don't invent a mobile menu unless asked.
- **Should the download button be disabled if there's no `.dmg` yet?** No — see "What NOT to build" above. It always points to the placeholder path.
- **Should email be validated?** Basic format validation only (has `@`, has a `.`, non-empty) — not verification, not deliverability checking. See `docs/02-email-download-flow.md` for the exact validation approach.
