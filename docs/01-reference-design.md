# Reference Design Spec

This is the original design brief FlowState's hero is ported from (a dark analytics SaaS called "Neuralyn"). Where FlowState differs, it's called out inline with **[FLOWSTATE: ...]** tags. Everywhere else, follow this exactly — exact Tailwind classes, exact timings, exact CSS.

We are only building **Section 1 (Hero)**. Section 2 (Testimonial) from the original brief is included below for reference/context only — **do not build it.**

---

## Fonts

- Inter (400, 500, 600, 700) for body/UI — via `@fontsource/inter`
- Instrument Serif (400, 400-italic) for the italic accent word — via `@fontsource/instrument-serif`

**[FLOWSTATE: same fonts, no change]**

## Color Theme

All HSL, dark mode by default in `:root`:

```css
--background: 0 0% 0%;        /* pure black */
--foreground: 0 0% 100%;      /* pure white */
--muted-foreground: 0 0% 65%;
--card: 0 0% 5%;
--border: 0 0% 20%;
--hero-subtitle: 210 17% 95%;
```

**[FLOWSTATE: same palette, no change. Everything stays black/white/muted-gray. Don't introduce a brand accent color unless asked — the botanical background image provides the only warmth on the page.]**

---

## Page Structure

### Section 1: Hero (full viewport height, `overflow-hidden`)

#### Navbar

Horizontal, padded `px-8 md:px-28 py-4`:

- **Left:** Logo image + "Neuralyn" text (`text-xl font-bold tracking-tight`) + nav links (Home, Services with `ChevronDown` icon, Reviews, Contact us) — links hidden on mobile, `gap-1` between links, `gap-12 md:gap-20` between logo and links
- **Right:** "Sign In" button — solid white background (`bg-foreground`), black text (`text-background`), `rounded-lg text-sm font-semibold`, hover opacity transition

**[FLOWSTATE substitutions:**
- Logo text: "FlowState" instead of "Neuralyn"
- Nav links: "Home", "Features" (no dropdown — remove `ChevronDown`, keep it simple), "Privacy" (this is a core selling point, deserves a nav slot), "GitHub"
- Right button: replace "Sign In" with a GitHub icon button. Same visual treatment (`bg-foreground text-background rounded-lg`) but render a GitHub mark icon (lucide-react has `Github`) instead of text, or icon + "GitHub" text — either is fine, pick whichever reads cleaner at the sizes involved. `href="#"` for now.
- **]**

#### Hero Content

Centered column, `mt-16 md:mt-20 px-4`:

**Tag pill:** "liquid glass" styled pill (`liquid-glass` class, defined below) with inner "New" badge (white bg, black text, `rounded-md text-sm font-medium px-2 py-0.5`) + descriptive text in `text-sm font-medium text-muted-foreground`. Pill has `px-3 py-2 rounded-lg mb-6`.

Original text: "New" badge + "Say Hello to Corewave v3.2"

**[FLOWSTATE: "New" badge + "100% Offline. Zero Servers." — see `docs/04-copy.md` for final placeholder copy]**

**Title:** `text-5xl md:text-7xl`, `tracking-[-2px]`, `font-medium`, `leading-tight md:leading-[1.15] mb-3`.

Original: "Your Insights." / "One Clear *Overview*." — the word "Overview" is in Instrument Serif italic (`font-serif italic font-normal`)

**[FLOWSTATE: two-line headline, one word in the italic serif accent — see `docs/04-copy.md`. Keep the exact same pattern: two short lines, last word of the second line in `font-serif italic font-normal`.]**

**Subtitle:** `text-lg font-normal leading-6 opacity-90 mb-8`, color uses CSS variable `--hero-subtitle`.

Original: "Neuralyn helps teams track metrics, goals, <br/> and progress with precision." (line break after "goals,")

**[FLOWSTATE: same structure — one sentence, one manual `<br/>` for a two-line wrap. See `docs/04-copy.md`.]**

**CTA Button:** Solid white (`bg-foreground text-background`), `rounded-full px-8 py-3.5 text-base font-medium`, `whileHover: scale 1.03`, `whileTap: scale 0.98`.

Original label: "Get Started for Free"

**[FLOWSTATE: "Download for macOS" or similar — this button triggers the email-gate flow described in `docs/02-email-download-flow.md`, it does not link anywhere directly. See that doc for full click behavior.]**

#### Dashboard + Video Area

Full viewport width using `w-screen` with `marginLeft: calc(-50vw + 50%)` trick, `aspect-ratio: 16/9`, positioned `relative`.

- **Background video:** `<video>`, absolutely positioned `inset-0 w-full h-full object-cover`.
- **Dashboard image:** Absolutely positioned, centered, `max-w-5xl w-[90%] rounded-2xl`, `mixBlendMode: "luminosity"`. Has parallax scroll (`y: 0 → -250`).
- **Bottom gradient fade:** Absolutely positioned at bottom of section, `h-40`, gradient from background to transparent, `z-30`, `pointer-events-none`.

**[FLOWSTATE — this is the biggest structural change, read carefully:**
- There is no separate "dashboard image" — the video itself is the full visual, not a background layer with an image on top. Remove the `mixBlendMode: luminosity` dashboard image entirely and its parallax transform.
- Instead, add the botanical foliage background image (see `docs/03-assets.md` for the asset and exact layering/z-index).
- Keep the `w-screen` / negative-margin full-bleed trick for the video area, and keep the `aspect-ratio: 16/9` on the video container.
- Keep the bottom gradient fade exactly as specified — same `h-40`, same black-to-transparent gradient, same `z-30 pointer-events-none`. This still needs to mask the hard bottom edge of the section.
- Video should be `rounded-2xl` (carrying over the dashboard image's corner radius) and centered the same way the dashboard image was (`max-w-5xl w-[90%]`), so it reads as a "card" floating in the section rather than a full-bleed video.
- **]**

#### Parallax Scroll Effects

`Framer Motion useScroll({ target: sectionRef, offset: ["start start", "end start"] })` + `useTransform`:

- Hero text content group: `y: [0, -200]` and `opacity: [1, 0]` (fades over first 50% of scroll)
- Dashboard image: `y: [0, -250]`

**[FLOWSTATE: keep the hero text parallax/fade exactly as specified. Drop the "dashboard image" parallax line since there's no separate dashboard image — if you want a subtle parallax on the video card itself, a gentle `y: [0, -100]` (roughly half the original magnitude, since it's a full card not a small floating image) is reasonable, but this is optional polish, not a requirement.]**

#### Entrance Animations

Staggered `initial={{ opacity: 0, y }}` / `animate={{ opacity: 1, y: 0 }}`:

- Tag pill: `y: 10`, duration `0.5s`, delay `0`
- Title: `y: 20`, duration `0.6s`, delay `0.1`
- Subtitle: `y: 20`, duration `0.6s`, delay `0.2`
- CTA: `y: 20`, duration `0.6s`, delay `0.3`
- Dashboard area: `y: 40`, duration `0.8s`, delay `0.4`

**[FLOWSTATE: identical, no change. "Dashboard area" now refers to the video card + foliage background wrapper as a single animated group.]**

#### Liquid Glass CSS

```css
.liquid-glass {
  background: rgba(255, 255, 255, 0.01);
  background-blend-mode: luminosity;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: none;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}
.liquid-glass::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.4px;
  background: linear-gradient(180deg,
    rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 20%,
    rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%,
    rgba(255,255,255,0.15) 80%, rgba(255,255,255,0.45) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
```

**[FLOWSTATE: copy verbatim, no change. Used only on the tag pill.]**

---

## Section 2: Testimonial — DO NOT BUILD

The original brief includes a testimonial section (scroll-driven word-reveal quote, avatar, author name/role). **This is explicitly cut from FlowState.** It's preserved here only so nobody mistakes its absence for an oversight, and in case a future version of the site wants to reintroduce something similar with a real user quote.

Original spec, for future reference only:

> `min-h-screen`, centered, `py-24 md:py-32 px-8 md:px-28`. Quote symbol image (`w-14 h-10 object-contain`). Testimonial text (`text-4xl md:text-5xl font-medium leading-[1.2]`) with scroll-driven per-word opacity/color reveal via `useScroll({ target: containerRef, offset: ["start end", "end center"] })`, each word a `motion.span` mapped to a sequential range. Author row with avatar, name, role. `max-w-3xl mx-auto`, left-aligned.

Do not implement this. The hero section is the entire page for now.
