# Research: SVG→PNG rendering approach for the Nix/pnpm stack

_Resolves [Research: SVG→PNG rendering approach for the Nix/pnpm stack](https://github.com/sigma/sd-tailscale/issues/6),
a ticket of the [Replace placeholder action icons with real art](https://github.com/sigma/sd-tailscale/issues/1) map._

## Question

Decide the mechanism to render source SVGs to **deterministic** PNGs at 72×72
(`.png`) and 144×144 (`@2x.png`) inside this repo's Nix devShell + pnpm + `just`
toolchain, and produce a single clear recommendation.

## Recommendation

**Use [`@resvg/resvg-js`](https://github.com/thx/resvg-js)** — a Node binding over
the pure-Rust [resvg](https://github.com/RazrFalcon/resvg) renderer — invoked from a
small Node script wired into a `just render-icons` recipe. Author each icon as one
SVG source of truth and **outline all text to paths** (no live `<text>` elements) so
rendering is font-independent.

This is the only candidate that gives us the ticket's headline requirement —
*deterministic* output — by construction, and the only one that needs **zero changes
to `flake.nix`**: it's an ordinary pnpm devDependency, run by the Node/pnpm the
devShell already ships, matching the flake's stated design that "JS deps come from
pnpm, not nix."

## Decision factors

The map fixes four axes (determinism, devShell availability, `just` wiring, fidelity).
Determinism is load-bearing: the pipeline runs on the maintainer's macOS box **and**
in CI on Linux (`flake.nix` targets `{x86_64,aarch64}-{linux,darwin}`), so "the same
SVG must produce byte-identical PNGs on every platform" is the real bar, not just
"looks right once."

### 1. `@resvg/resvg-js` — **recommended**

- **Determinism — strongest.** resvg is written entirely in Rust and, in the
  project's own words, "doesn't rely on any system libraries [which] allows us to
  have reproducible results on all supported platforms." No cairo, no fontconfig, no
  system-version drift → identical pixels across macOS and Linux.
- **devShell availability — trivial, no Nix edit.** Ships prebuilt per-platform
  native binaries via napi-rs `optionalDependencies` (macOS x64/arm64, Linux
  gnu/musl x64/arm64, etc. — covers all four flake target systems). No `node-gyp`,
  no compiler, no addition to the toolbox-pinned devShell. `pnpm install` just works.
- **`just` wiring — trivial.** Small Node script:
  ```js
  import { Resvg } from "@resvg/resvg-js";
  import { readFileSync, writeFileSync } from "node:fs";
  const svg = readFileSync(src);
  for (const [suffix, size] of [["", 72], ["@2x", 144]]) {
    const png = new Resvg(svg, { fitTo: { mode: "width", value: size } })
      .render().asPng();
    writeFileSync(`${out}${suffix}.png`, png);
  }
  ```
  Wrap as `just render-icons`; run before `just validate`.
- **Fidelity — excellent for icons.** resvg has strong static-SVG path/shape
  coverage. Its one limitation — "no native text rendering," only embedded
  TTF/OTF fonts — is a non-issue once text is outlined to paths, which we should do
  anyway for reproducibility.
- **Cost / caveat:** text must be outlined to paths (or a font embedded as a buffer)
  in the SVG sources. This is a source-authoring convention, cheap to hold, and it is
  what *guarantees* the cross-platform byte-identity above.

### 2. `sharp` — not recommended here

- Built on **libvips**, which rasterizes SVG via **librsvg** (libxml + **cairo**,
  with **fontconfig** for text). Determinism therefore rides on the exact
  librsvg/cairo/fontconfig versions in the bundled binary; cross-platform
  byte-identity is a weaker guarantee than resvg's self-contained engine, and text
  is exposed to system font resolution.
- Ships prebuilt per-platform binaries (fine for the devShell), but it's a
  general-purpose raster **image-processing** library — far more surface than
  "SVG→PNG at two sizes." We'd take on a heavy dependency for a sliver of its API.
- SVG scaling is DPI/`density`-driven (default 72), an awkward fit for "render at an
  exact pixel width" versus resvg's direct `fitTo: { mode: "width" }`.

### 3. librsvg / `rsvg-convert` via Nix — not recommended here

- A clean CLI (`rsvg-convert -w 72 -h 72 in.svg -o out.png`), but it is **not** in
  the current devShell: the shell is a curated `firefly-engineering/toolbox`
  (`typescript-toolchain` + `just`), so adopting rsvg-convert means adding a raw
  `pkgs.librsvg` to `flake.nix` — a deviation from the toolbox pattern and a new
  system-level dependency to pin.
- Same engine family as sharp's SVG path (cairo + pango/fontconfig), so it carries
  the **same font/text determinism hazard** across macOS vs Linux. Nix pinning tames
  version drift but not the fontconfig/pango text-rendering variance.

## Summary table

| Candidate | Determinism (cross-platform) | In devShell now? | `just` wiring | Fidelity (icons) |
|---|---|---|---|---|
| **`@resvg/resvg-js`** | **Strong — self-contained Rust, explicit reproducibility guarantee** | **Yes — pnpm devDep, prebuilt binaries, no flake edit** | Trivial (Node script) | Excellent (text→paths) |
| `sharp` | Moderate — librsvg/cairo/fontconfig via libvips | Yes (pnpm), but heavy | OK, DPI-driven sizing | Good |
| `rsvg-convert` (Nix) | Moderate — cairo/pango/fontconfig | **No — requires `flake.nix` change** | OK (CLI) | Good |

## Consequences for the map

- **Unblocks / shapes** [Build the SVG→PNG render pipeline](https://github.com/sigma/sd-tailscale/issues/8):
  the pipeline is a Node script over `@resvg/resvg-js` + a `just render-icons` recipe,
  reading one SVG per icon and emitting `<name>.png` (72) and `<name>@2x.png` (144).
- **Constrains** the SVG authoring work (map "Not yet specified"): sources must
  **outline text to paths** for reproducibility.
