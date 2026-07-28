# Icon sources

SVG **sources of truth** for the plugin's key/action icons. The build renders
them to committed PNGs under `../dev.yrh.tailscale.sdPlugin/imgs/`; edit the SVGs
here, never the generated PNGs.

## Render

```sh
just render-icons      # inside the nix devShell
```

Runs `scripts/render-icons.mjs` over `@resvg/resvg-js` (pure-Rust
[resvg](https://github.com/RazrFalcon/resvg) — no system libraries, so output is
byte-identical on macOS and Linux CI). This was the mechanism chosen in the
render-approach research; see `docs/research/svg-to-png-rendering.md`.

## Convention

The source tree **mirrors** the output tree, one size pair per source:

| Source                        | Output                                                    |
| ----------------------------- | --------------------------------------------------------- |
| `icons/<path>/<name>.svg`     | `imgs/<path>/<name>.png` (72×72), `<name>@2x.png` (144×144) |

- Author each SVG with a **square viewBox** — resvg fits to width, so a square
  source yields square PNGs.
- **Outline text to paths.** resvg does not rasterize live `<text>`; outlining
  also removes font-version drift, keeping renders reproducible.

`_sample/placeholder.svg` is a throwaway that proves the pipeline; its rendered
output under `imgs/_sample/` is git-ignored. Real icon sources graduate from the
map's authoring work.

## Adding other sizes

`RENDER_SIZES` in `scripts/render-icons.mjs` fixes the 72 / @2x 144 action-key
pair. Other asset classes (mono category 28×28, plugin 256/512, marketplace
288×288) get their own sizes when their sources are authored — extend that array
then.
