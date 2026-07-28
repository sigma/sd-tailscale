// Composite the short tailnet name onto an action button's icon.
//
// This is the shared rendering primitive #31 (wire the display into all three
// actions) consumes. Contract settled in #26/#27/#28: bake the name *into the
// icon image* (resvg SVG→PNG + `setImage`) as a translucent top-strip, leaving
// the SDK title channel free for the `No\nCLI` marker and user titles. The
// strip appears **iff** a non-empty short name resolves; with no name we return
// the plain base icon unchanged — never a placeholder (#27's name-only rule).
// Every repaint recomputes the whole image, so the button self-heals.
//
// resvg is a *native* module. It ran only at build time before this
// (`scripts/render-icons.mjs`); this is the first runtime consumer, so it is
// marked `external` in `rollup.config.mjs` (Node resolves it from the hoisted
// workspace `node_modules` at run time) and lives in `dependencies`, not
// `devDependencies`. Shipping the `.node` binary inside a redistributable
// `.sdPlugin` is a separate, out-of-scope concern (see the map's #24 body).

import { readFileSync } from "node:fs";

import { Resvg } from "@resvg/resvg-js";

/** The two Stream Deck key image sizes: 72px @1x, 144px @2x. */
export type IconSize = 72 | 144;

// Strip geometry, authored against the 144px (@2x) canvas and scaled to the
// requested size. Numbers come from the #26 prototype's A2 top-strip mockup.
const REF = 144;
const STRIP_HEIGHT = 34;
const STRIP_FILL = "#000000";
const STRIP_OPACITY = 0.55;
const TEXT_FILL = "#ffffff";
const TEXT_BASELINE_Y = 24;
const PADDING_X = 8;
const FONT_SIZE_MAX = 20;
// ~11px floor per #26 — a default that's cheaply revisitable.
const FONT_SIZE_MIN = 11;
const FONT_FAMILY = "Helvetica, Arial, sans-serif";
// Rough advance width per unit font-size for the bold sans above. resvg gives
// no cheap text-measurement API, so — like the prototype — we estimate. It only
// needs to be good enough to pick a shrink step / ellipsis cut; the strip is
// centered, so small errors just leave slightly more or less side padding.
const CHAR_WIDTH_FACTOR = 0.6;
const ELLIPSIS = "…";

/** How a name is laid out within the strip after shrink-to-fit + ellipsis. */
export interface StripText {
  /** The text actually drawn — the name, possibly ellipsized. */
  text: string;
  /** Font size in reference (144px canvas) units. */
  fontSize: number;
}

/**
 * Fit `name` into a strip `stripWidth` px wide: shrink the font from
 * {@link FONT_SIZE_MAX} toward {@link FONT_SIZE_MIN}, then — if it still
 * overflows at the floor — truncate with an ellipsis. Pure and deterministic;
 * widths are estimated (see {@link CHAR_WIDTH_FACTOR}). Reference-space units.
 */
export function fitNameToStrip(name: string, stripWidth: number = REF): StripText {
  const usable = stripWidth - 2 * PADDING_X;
  const fits = (text: string, fontSize: number) =>
    text.length * fontSize * CHAR_WIDTH_FACTOR <= usable;

  let fontSize = FONT_SIZE_MAX;
  while (fontSize > FONT_SIZE_MIN && !fits(name, fontSize)) fontSize -= 1;
  if (fits(name, fontSize)) return { text: name, fontSize };

  // At the floor and still overflowing: ellipsize to the widest fitting prefix.
  fontSize = FONT_SIZE_MIN;
  const maxChars = Math.max(1, Math.floor(usable / (fontSize * CHAR_WIDTH_FACTOR)));
  if (name.length <= maxChars) return { text: name, fontSize };
  return { text: name.slice(0, Math.max(1, maxChars - 1)) + ELLIPSIS, fontSize };
}

/** Escape the five XML metacharacters so a name is safe inside SVG text. */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Composite `name`'s top-strip onto `basePng`, returning a new PNG at `size`.
 *
 * With an empty or whitespace-only name, returns `basePng` **unchanged** — the
 * plain base icon, no strip (#27). Otherwise wraps the base PNG in an SVG,
 * draws the translucent strip + fitted text over it, and rasterizes via resvg.
 * `basePng` must already be a square PNG at `size` px.
 */
export function compositeButtonImage(basePng: Buffer, name: string, size: IconSize): Buffer {
  const trimmed = name.trim();
  if (trimmed === "") return basePng;

  const scale = size / REF;
  const { text, fontSize } = fitNameToStrip(trimmed);
  const href = `data:image/png;base64,${basePng.toString("base64")}`;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
    `<image href="${href}" x="0" y="0" width="${size}" height="${size}" preserveAspectRatio="none"/>` +
    `<rect x="0" y="0" width="${size}" height="${STRIP_HEIGHT * scale}" ` +
    `fill="${STRIP_FILL}" opacity="${STRIP_OPACITY}"/>` +
    `<text x="${size / 2}" y="${TEXT_BASELINE_Y * scale}" font-family="${FONT_FAMILY}" ` +
    `font-size="${fontSize * scale}" font-weight="700" text-anchor="middle" fill="${TEXT_FILL}">` +
    `${escapeXml(text)}</text>` +
    `</svg>`;

  return Buffer.from(
    new Resvg(svg, {
      fitTo: { mode: "width", value: size },
      font: { loadSystemFonts: true },
      background: "rgba(0,0,0,0)",
    })
      .render()
      .asPng(),
  );
}

/** A PNG buffer as a `data:` URI, ready to hand to the SDK `setImage`. */
export function toSetImageUri(png: Buffer): string {
  return `data:image/png;base64,${png.toString("base64")}`;
}

// Base action icons ship as committed PNGs under the plugin's imgs/actions/.
// At run time the bundle is `…/bin/plugin.js`, so imgs are one level up.
const ICONS_DIR = new URL("../imgs/actions/", import.meta.url);

/** Absolute URL of a committed base icon PNG for `stem` at `size`. */
function baseIconUrl(stem: string, size: IconSize, iconsDir: URL): URL {
  const suffix = size === 144 ? "@2x" : "";
  return new URL(`${stem}${suffix}.png`, iconsDir);
}

/**
 * Render a ready-for-`setImage` data URI for base icon `stem` (e.g.
 * `"connected"`, `"exit_node_on"`, `"copy_ip"`) at `size`, with `name`'s
 * top-strip composited on when it is non-empty. The runtime convenience #31
 * calls; reads the committed base PNG from disk. `size` defaults to 144 (@2x).
 * `iconsDir` is a test seam — production callers take the bundle-relative
 * default, which points at the committed icons beside the running plugin.
 */
export function renderButtonImage(
  stem: string,
  name: string,
  size: IconSize = 144,
  iconsDir: URL = ICONS_DIR,
): string {
  const basePng = readFileSync(baseIconUrl(stem, size, iconsDir));
  return toSetImageUri(compositeButtonImage(basePng, name, size));
}
