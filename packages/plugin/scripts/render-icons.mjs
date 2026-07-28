// Render source SVG icons to the plugin's committed PNG assets.
//
// The pipeline the render-approach research (#6) settled on: a small Node
// script over `@resvg/resvg-js` (pure-Rust resvg, no system libraries) so the
// PNGs are byte-identical on the maintainer's macOS box and Linux CI. No
// `flake.nix` change — resvg-js is an ordinary pnpm devDependency with prebuilt
// per-platform binaries.
//
// Source tree mirrors the output tree: every `icons/<path>/<name>.svg` renders
// to `imgs/<path>/<name>.png` (72×72) and `imgs/<path>/<name>@2x.png` (144×144).
// Author each SVG with a square viewBox and text outlined to paths (resvg does
// not rasterize live text — outlining is what we want for reproducibility
// anyway). Run via `just render-icons`.
//
// Sizes are the Stream Deck action-key pair (72 / @2x 144). Other asset classes
// (mono category 28×28, plugin 256/512, marketplace 288×288) get their own
// sizes when their sources are authored — extend RENDER_SIZES then.

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Resvg } from "@resvg/resvg-js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(scriptDir, "..");
const SRC_ROOT = join(pluginRoot, "icons");
const OUT_ROOT = join(pluginRoot, "dev.yrh.tailscale.sdPlugin", "imgs");

// [output suffix, pixel width]. resvg fits to width; square sources stay square.
const RENDER_SIZES = [
  ["", 72],
  ["@2x", 144],
];

/** Recursively collect every `.svg` under `dir`, sorted for deterministic order. */
async function collectSvgs(dir) {
  const found = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOENT") return found;
    throw err;
  }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await collectSvgs(full)));
    } else if (entry.isFile() && entry.name.endsWith(".svg")) {
      found.push(full);
    }
  }
  return found;
}

async function renderOne(svgPath) {
  const svg = await readFile(svgPath);
  const rel = relative(SRC_ROOT, svgPath).replace(/\.svg$/, "");
  const written = [];
  for (const [suffix, width] of RENDER_SIZES) {
    const png = new Resvg(svg, {
      fitTo: { mode: "width", value: width },
      // Force a transparent background so mono/transparent assets stay clean.
      background: "rgba(0,0,0,0)",
    })
      .render()
      .asPng();
    const outPath = join(OUT_ROOT, `${rel}${suffix}.png`);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, png);
    written.push({ outPath, width });
  }
  return { rel, written };
}

async function main() {
  const svgs = await collectSvgs(SRC_ROOT);
  if (svgs.length === 0) {
    console.error(
      `No source SVGs found under ${relative(pluginRoot, SRC_ROOT)}/ — nothing to render.`,
    );
    process.exit(1);
  }
  let count = 0;
  for (const svg of svgs) {
    const { written } = await renderOne(svg);
    for (const { outPath, width } of written) {
      count += 1;
      console.log(`  ${relative(pluginRoot, outPath)}  (${width}×${width})`);
    }
  }
  console.log(`Rendered ${count} PNG(s) from ${svgs.length} source SVG(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
