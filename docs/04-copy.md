# Placeholder Copy

Every string below is a draft, written to be directionally correct and structurally correct (right length, right tone, right emphasis pattern) — not final. Treat the *shape* of each element as the real spec (a headline needs to stay short and punchy, a subtitle needs to stay one sentence) and the *words* as freely editable.

## Navbar

- Logo text: `FlowState`
- Nav links: `Home`, `Features`, `Privacy`, `GitHub`
- Right button: GitHub icon (no label needed, or "GitHub" if a text label reads better at the button's size) — see `docs/01-reference-design.md` for the icon-vs-text call

## Hero

### Tag pill
- Badge: `New`
- Text: `100% Offline. Zero Servers.`

(Matches the reference's pattern of a short badge + short descriptive phrase. Keep this under ~6 words.)

### Headline
Two lines, last word of the second line in the italic serif accent (matching the reference's "Your Insights." / "One Clear *Overview*." pattern):

```
Speak Your Mind.
Stay Completely *Private*.
```

(Alternative if "Private" doesn't feel like the right accent word: "Offline", "Silent", "Local" are other one-word candidates that carry the same weight.)

### Subtitle
One sentence, manual `<br/>` for a two-line wrap (matching the reference's line-break-after-comma pattern):

```
FlowState turns your voice into text, instantly — <br/>
no internet, no cloud, no one listening but you.
```

### CTA button
```
Download for macOS
```

(Not "Get Started for Free" — FlowState isn't a signup flow, it's a direct download, so the button copy should reflect that. Avoid "Free Trial" language since there's no trial/paid split implied anywhere in this brief.)

## Email capture panel

Appears after clicking the CTA.

- Panel headline: `Get FlowState`
- Panel subtext: `Drop your email and we'll let you know when new features ship. Totally optional.`
- Email field placeholder: `you@example.com`
- Submit button: `Download`
- Skip link (faded, directly below submit): `Skip and download`
- Inline validation error (if email format is invalid): `That doesn't look like a valid email.`

## Post-download share toast

- Toast headline: `Downloading FlowState…`
- Toast subtext: `Enjoying it? A share helps more than you'd think.`
- Button: `Share on X`

## Footer (minimal — see CLAUDE.md, "no footer beyond what's strictly needed")

If a footer is included at all, keep it to a single line:

```
FlowState — dictation that never leaves your Mac.
```

No links, no legal boilerplate, no newsletter signup (that's already handled by the email capture panel above) — unless the user asks for more later.
