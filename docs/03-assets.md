# Assets

Everything the site needs, what it's for, and where it comes from. Items marked **AI-generate** are things you'll produce with an image/video model before or during the build. Items marked **user-provided** are things the site should reference by a stable path but that don't need to exist yet for the site to build and run correctly.

## Full list

| File | Purpose | Source | Spec |
|---|---|---|---|
| `public/logo.png` | Navbar icon | AI-generate | Small mark, square-ish or circular, needs to read clearly at ~24-32px. Simple shape, not detailed illustration — think wordmark-adjacent icon, not a scene. |
| `public/favicon.ico` + `public/favicon.png` | Browser tab icon | Derived from logo | Standard favicon sizes (32x32, 16x16). Can be generated from `logo.png` via any favicon generator once the logo exists. |
| `public/og-image.png` | Social share preview | AI-generate or composed | 1200×630px. Should include the FlowState name/logo and ideally a hint of the product — this is what shows up when the X share link (or any link to the site) is posted/pasted. Dark background matching the site's palette. |
| `public/hero-foliage.png` | Background botanical layer behind hero video | AI-generate | See "Hero foliage image" section below for full spec — this is the one non-obvious asset. |
| Hero demo video | Main visual in the hero section | **User-provided**, recorded post-build | See "Hero video" section below for spec and placeholder handling. |
| `public/downloads/FlowState.dmg` | Download target | **User-provided**, dummy for now | Doesn't need to be a real macOS installer yet. Can be any placeholder file (even a renamed empty `.txt`) — see note below. |

## Hero foliage image

This is the dark, moody botanical/dried-flower background layer visible in the reference design's hero — foliage lit warm/orange against black, positioned so it appears to grow up from the bottom of the section.

### What it is, structurally

**One wide image, not two separate corner images.** It spans roughly the width of the video/dashboard area (not the full page — though it can extend further if that reads better; the video card will sit on top and mask most of the center regardless). Foliage should be naturally denser toward the left and right edges and thin out (or disappear) toward the center, so that when the video card is layered on top, what's visible on either side reads like organic growth peeking out from behind the card — similar visual effect to the reference's two-clump version, but as a single asset.

### Generation prompt guidance (for an AI image model)

Aim for: dried wildflowers / seed heads / tall grass silhouettes, warm amber/orange rim-lighting against a near-black background, moody and slightly desaturated except for the warm highlights, shot low and wide (landscape orientation), photographic or photoreal rendering style (not flat illustration) — matching the reference screenshot's aesthetic. Transparent or pure-black background so it composites cleanly against the page's `--background: 0 0% 0%`.

### Format & dimensions

- PNG with transparency if possible (cleanest compositing). If transparency isn't achievable, pure black (`#000000`) background is an acceptable fallback since it'll sit on the page's black background anyway — just make sure the black is a true match, not a near-black that shows a seam.
- Wide aspect ratio, roughly matching or slightly exceeding the hero video's width. Something in the 2:1 to 3:1 range is reasonable — exact dimensions aren't critical since it'll be positioned with CSS, not used at native size.

### Layering / z-index — read this carefully

This is a three-layer stack within the hero's dashboard/video area, bottom to top:

1. **z-0 (or the page's implicit base layer):** the page's plain black background. Nothing to build here, it's just `--background`.
2. **z-10: `hero-foliage.png`** — positioned absolutely within the hero section, anchored to the **bottom**, roughly centered horizontally (or spanning the width of the video container), allowed to extend slightly above where the video card's bottom edge will sit so it visibly pokes out from behind the card on both sides.
3. **z-20: the video card** — the `<video>` element, `rounded-2xl`, centered, `max-w-5xl w-[90%]` (per `docs/01-reference-design.md`), sitting on top of the foliage image. Because the video card is opaque, it will naturally mask the center portion of the foliage image — this is expected and is exactly what creates the "peeking out from behind" effect.
4. **z-30: the bottom gradient fade** — per the reference spec, `h-40`, black-to-transparent, `pointer-events-none`, sitting above everything to smooth the hard bottom edge of the section into the rest of the page.

If the foliage image ends up fully hidden behind the video card with nothing visible at the edges, the foliage image's width relative to the video container is too narrow, or its vertical position needs to shift so more of it extends beyond the video card's bottom edge. Adjust positioning, not z-index, to fix that — the z-index order above is correct and shouldn't need to change.

## Hero video

Replaces the reference design's dashboard screenshot + video background combo entirely. This is the main visual element of the page.

- **Spec for when it's recorded:** 16:9 aspect ratio (matches the reference's `aspect-ratio: 16/9` on the video container), should loop cleanly since it'll autoplay on loop, ideally 10-30 seconds — long enough to show the dictation flow in action, short enough to loop without feeling repetitive. No audio needed since it'll be muted (`autoplay muted loop playsInline` per the reference spec).
- **What it should show:** FlowState in use — dictating text somewhere on macOS, ideally showing the "it just works, no internet required" nature of it if that's easy to convey visually (e.g., could show a "No internet connection" indicator or airplane mode toggled on, if that's a clean way to make the offline claim visible rather than just claimed in copy).
- **Placeholder handling until it's recorded:** use a stable path like `public/hero-video.mp4` (or wherever makes sense in the project structure) and reference it via a config constant, not hardcoded inline in the component — same pattern as the `.dmg` path. Until a real file exists at that path, the `<video>` element will simply fail to load/show a blank area, which is an acceptable placeholder state; don't build conditional "video coming soon" UI around this, same reasoning as the `.dmg` file.

## The dummy `.dmg` file

Doesn't need to be a real installer. A zero-byte or small dummy file renamed to `FlowState.dmg` at `public/downloads/FlowState.dmg` is sufficient — this satisfies the download link's `href` without needing a real build, and the user will drop the real signed `.dmg` into this exact path later with no code changes required.
