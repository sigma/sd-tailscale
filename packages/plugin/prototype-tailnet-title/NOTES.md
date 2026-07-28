# Prototype — tailnet name on a button (issue #26)

**Throwaway.** Delete this directory once #26 is decided (or fold the chosen
approach into the real render path).

## Question (from #26)

How does the short tailnet name (e.g. `van-scylla`) appear at the *top* of an
action button?

1. **Placement/mechanism** — SDK `setTitle` (with a manifest title position) vs.
   baking the text into the rendered icon image (`setImage`)?
2. **Title ownership** — it must coexist with the existing `No\nCLI` marker
   (health = `binary-missing`, currently drawn via `setTitle`) and with
   user-set titles. Does the plugin own the title, share it, or avoid it
   entirely by drawing into the icon?
3. **Long names** — truncation / ellipsis / shrink-to-fit.

## What the mockup shows (`mockups.png`)

Rendered with `@resvg/resvg-js` (already a plugin dep, but **not yet wired into
any source** — today's icons are static PNGs and `setTitle` is used only for the
`No\nCLI` marker at `TitleAlignment: middle`). Real 144×144 @2x action icons as
backgrounds.

- **A1 setTitle top** — SDK-native white text w/ outline. Zero render code; just
  needs `TitleAlignment: top`. Occupies *the* title slot.
- **A2 baked top-strip** / **A3 baked pill** — text drawn into the image via a
  SVG→PNG pipeline + `setImage`. Full control of placement; leaves the title
  slot free.
- **B1 truncate** / **B2 ellipsis** / **B3 shrink-to-fit** — long-name handling.
- **C1** baked name coexists with `No CLI` marker. **C2** baked name (top) +
  user title (bottom) both fit. **C3** the clash: if the name takes the title's
  top slot, `No CLI` gets bumped elsewhere — one title slot, two claimants.

## The real tradeoff surfaced

`setTitle` is **one shared slot** already spoken for by the `No\nCLI` marker and
by user titles. Putting the name there forces a sharing policy (A1/C3). Baking
into the icon (A2/A3) makes the name the plugin's own real estate and leaves the
title untouched — at the cost of building the resvg render pipeline the dep was
added for.

## Verdict — bake into the icon, top-strip (A2)

Decided on #26 (closed 2026-07-28).

- **Mechanism:** draw the name *into the icon image* via resvg SVG→PNG +
  `setImage`. Not `setTitle`. (Wires up the resvg dep that was staged but unused.)
- **Title ownership:** plugin avoids the SDK title for the name entirely, so
  `setTitle` stays free for the `No\nCLI` marker + user titles. No clash.
- **Placement:** translucent top-strip (A2 / C1 / C2).
- **Long names (default, revisitable):** shrink-to-fit to a ~11px floor, then
  ellipsis.

Fold A2 into the real render path when the map's implementation ticket
graduates (waits on #27 edge-states + #28 data-flow), then delete this dir.
