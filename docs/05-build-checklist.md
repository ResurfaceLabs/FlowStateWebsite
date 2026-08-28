# Build Checklist

A suggested order, not a strict requirement — but building in roughly this sequence means there's something visible to look at early, and the riskier/fiddlier pieces (the layered background, the email flow) come after the basic structure is already working and easy to verify against.

## 1. Scaffold
- Vite + React + TypeScript project
- Tailwind configured with the color theme from `docs/01-reference-design.md`
- Fonts installed (`@fontsource/inter`, `@fontsource/instrument-serif`) and imported
- Framer Motion, lucide-react (for the GitHub icon) installed

## 2. Static layout, no animation yet
- Navbar: logo, nav links, GitHub button — static, no motion
- Hero content: tag pill, headline (with the italic accent word), subtitle, CTA button — static
- Confirm fonts are rendering correctly (Inter for body, Instrument Serif italic for the accent word) before moving on

## 3. Liquid glass pill
- Add the `liquid-glass` CSS class from `docs/01-reference-design.md` verbatim
- Apply to the tag pill, confirm the gradient border effect renders

## 4. Hero video + foliage layering
- Video container: `w-screen` + negative margin full-bleed trick, `aspect-ratio: 16/9`
- Video element referencing the placeholder path (per `docs/03-assets.md`) — fine if nothing renders yet, this is expected until the real video exists
- Foliage image, positioned per the z-index/layering spec in `docs/03-assets.md` — this is the part most worth eyeballing carefully once the placeholder foliage image exists, since it's the one piece of layout that isn't a direct port of the reference
- Bottom gradient fade

This step is easiest to verify with a temporary placeholder video (even a solid-color box or any stock clip) just to confirm the layering reads correctly — swap in the real video later without touching the layout code.

## 5. Entrance + parallax animations
- Add the staggered entrance animations (tag pill → title → subtitle → CTA → video area) per the exact delays/durations in `docs/01-reference-design.md`
- Add the hero text parallax fade on scroll
- Skip the dashboard-image parallax (there is no separate dashboard image) — optional subtle video-card parallax if it feels right, per the note in `docs/01-reference-design.md`

## 6. Email capture + download flow
- Build the email panel UI (headline, subtext, field, submit, skip link) per `docs/04-copy.md`
- Wire up validation (`docs/02-email-download-flow.md`)
- Wire up `triggerDownload()` pointing at the placeholder `.dmg` path
- Wire up `submitEmailInBackground()` — leave `VITE_SHEETS_ENDPOINT` unset/empty in `.env` for now, confirm the no-op early-return works cleanly (download still fires with no errors even with no endpoint configured)
- Double-check: is the fetch call awaited anywhere on the path to `triggerDownload()`? It should not be. This is the one thing worth explicitly re-reading `docs/02-email-download-flow.md` for before considering this step done.

## 7. Share toast
- Build the toast UI (headline, subtext, share button) per `docs/04-copy.md`
- Wire up `window.open()` with the X intent URL, triggered only by the button click — confirm it does NOT fire automatically when the download starts

## 8. Polish pass
- Favicon, OG image (once generated per `docs/03-assets.md`)
- Responsive check — nav links hidden on mobile per the reference spec, confirm the hero and email panel don't break at narrow widths
- Confirm the placeholder `.dmg` file exists at the right path so the download link doesn't 404

## What "done" looks like for this first build

- The page loads, looks like the reference design's hero with the substitutions applied, even with placeholder video/foliage images
- Clicking the CTA opens the email panel; both submit and skip paths trigger a download
- The download never hangs waiting on a network call
- The share toast appears after download and only opens X on explicit click
- Nothing throws a console error if `VITE_SHEETS_ENDPOINT` is unset

Everything past this point (real video, real foliage image, real `.dmg`, real Sheets endpoint) is asset/config swaps into paths that already exist — no further code changes should be needed for those.
