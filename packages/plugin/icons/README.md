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

The source tree **mirrors** the output tree; each source renders to the size
pair its **asset class** needs (Elgato spec matrix, research #5):

| Source                          | Output `.png` / `@2x.png` | Class                     |
| ------------------------------- | ------------------------- | ------------------------- |
| `icons/actions/<name>.svg`      | 72×72 / 144×144           | action key image          |
| `icons/plugin/category-icon.svg`| 28×28 / 56×56             | manifest `CategoryIcon`   |
| `icons/plugin/marketplace.svg`  | 256×256 / 512×512         | manifest `Icon` (plugin)  |
| _(anything else, e.g. `_sample/`)_ | 72×72 / 144×144        | action-key fallback       |

- Author each SVG with a **square viewBox** — resvg fits to width, so a square
  source yields square PNGs.
- **Outline text to paths.** resvg does not rasterize live `<text>`; outlining
  also removes font-version drift, keeping renders reproducible.

`_sample/placeholder.svg` is a throwaway that proves the pipeline; its rendered
output under `imgs/_sample/` is git-ignored. Real icon sources graduate from the
map's authoring work.

## Adding other sizes

Sizing lives in `scripts/render-icons.mjs`: `DEFAULT_SIZES` is the 72 / @2x 144
action-key pair, and `SIZES_BY_REL` overrides it per source path for the
non-key classes. To render a new class at its own size, add an entry keyed by
the source's `icons/`-relative path (without extension).

Marketplace **listing** art (288×288 + 1920×960 banner) is uploaded to the
Elgato Marketplace portal, not shipped in the `.sdPlugin` bundle, and a 2:1
banner can't come from a square source — so it's intentionally out of this
pipeline.
