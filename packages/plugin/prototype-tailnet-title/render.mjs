// PROTOTYPE — throwaway. Answers issue #26: how the short tailnet name renders
// on a Stream Deck button. Renders a contact sheet of button mockups (real
// 144x144 @2x action icons as backgrounds) comparing placement approaches,
// long-name handling, and coexistence with the `No\nCLI` marker + user titles.
//
// Run:  node packages/plugin/prototype-tailnet-title/render.mjs
// Delete me once the design question is answered.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const here = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(here, "..", "dev.yrh.tailscale.sdPlugin", "imgs", "actions");
const KEY = 144; // Stream Deck @2x key size

const dataUri = (file) =>
  `data:image/png;base64,${readFileSync(join(iconsDir, file)).toString("base64")}`;
const ICON = {
  connected: dataUri("connected@2x.png"),
  disconnected: dataUri("disconnected@2x.png"),
  exitOn: dataUri("exit_node_on@2x.png"),
  copyIp: dataUri("copy_ip@2x.png"),
};

// --- button primitives -----------------------------------------------------

const bg = (href) =>
  `<rect width="${KEY}" height="${KEY}" rx="18" fill="#1b1c1f"/>` +
  `<image href="${href}" width="${KEY}" height="${KEY}"/>`;

// Simulated SDK setTitle: white text with a dark outline, positioned by
// TitleAlignment. Stream Deck's default title font is bold ~ this weight.
const sdkTitle = (text, align = "top", size = 22) => {
  const y = align === "top" ? 24 : align === "bottom" ? KEY - 12 : KEY / 2 + 7;
  return (
    `<text x="${KEY / 2}" y="${y}" font-family="Helvetica, Arial, sans-serif" ` +
    `font-size="${size}" font-weight="700" text-anchor="middle" ` +
    `fill="#ffffff" stroke="#000000" stroke-width="3" paint-order="stroke" ` +
    `stroke-linejoin="round">${text}</text>`
  );
};

// Baked-in top strip: a translucent bar drawn INTO the icon image via setImage.
const bakedStrip = (text, size = 20) =>
  `<rect x="0" y="0" width="${KEY}" height="34" fill="#000000" opacity="0.55"/>` +
  `<text x="${KEY / 2}" y="24" font-family="Helvetica, Arial, sans-serif" ` +
  `font-size="${size}" font-weight="700" text-anchor="middle" fill="#ffffff">${text}</text>`;

// Baked-in pill/badge at the top.
const bakedPill = (text, size = 18) => {
  const w = Math.min(KEY - 12, 14 + text.length * size * 0.62);
  const x = (KEY - w) / 2;
  return (
    `<rect x="${x}" y="8" width="${w}" height="30" rx="15" fill="#2f6fed"/>` +
    `<text x="${KEY / 2}" y="28" font-family="Helvetica, Arial, sans-serif" ` +
    `font-size="${size}" font-weight="700" text-anchor="middle" fill="#ffffff">${text}</text>`
  );
};

// --- tiles: each returns inner SVG for one 144x144 button ------------------

const tiles = [
  // Row A — placement approaches, short name
  { cap: "A1 · setTitle top", svg: bg(ICON.connected) + sdkTitle("van-scylla", "top") },
  { cap: "A2 · baked top-strip", svg: bg(ICON.connected) + bakedStrip("van-scylla") },
  { cap: "A3 · baked pill", svg: bg(ICON.connected) + bakedPill("van-scylla") },

  // Row B — long name handling (name = "really-long-tailnet")
  { cap: "B1 · truncate", svg: bg(ICON.exitOn) + bakedStrip("really-lo") },
  { cap: "B2 · ellipsis", svg: bg(ICON.exitOn) + bakedStrip("really-l…") },
  { cap: "B3 · shrink-to-fit", svg: bg(ICON.exitOn) + bakedStrip("really-long-tailnet", 12) },

  // Row C — coexistence
  { cap: "C1 · baked name + No CLI", svg: bg(ICON.disconnected) + bakedStrip("van-scylla") + sdkTitle("No\nCLI".replace("\n", " "), "middle", 20) },
  { cap: "C2 · baked name + user title", svg: bg(ICON.copyIp) + bakedStrip("van-scylla") + sdkTitle("Home", "bottom", 20) },
  { cap: "C3 · title clash (both want top)", svg: bg(ICON.disconnected) + sdkTitle("van-scylla", "top") + sdkTitle("No CLI", "bottom", 18) },
];

// --- contact sheet layout --------------------------------------------------

const COLS = 3;
const GAP = 28;
const CAP_H = 30;
const CELL = KEY + CAP_H;
const rows = Math.ceil(tiles.length / COLS);
const W = COLS * KEY + (COLS + 1) * GAP;
const H = rows * CELL + (rows + 1) * GAP + 40;

let body = `<rect width="${W}" height="${H}" fill="#0d0e10"/>`;
body +=
  `<text x="${GAP}" y="30" font-family="Helvetica, Arial, sans-serif" font-size="17" ` +
  `font-weight="700" fill="#e6e6e6">#26 · tailnet name on a button — 144×144 @2x mockups</text>`;

tiles.forEach((t, i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const x = GAP + col * (KEY + GAP);
  const y = 40 + GAP + row * (CELL + GAP);
  body += `<g transform="translate(${x},${y})">${t.svg}</g>`;
  body +=
    `<text x="${x + KEY / 2}" y="${y + KEY + 20}" font-family="Helvetica, Arial, sans-serif" ` +
    `font-size="13" fill="#9aa0a6" text-anchor="middle">${t.cap}</text>`;
});

const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${body}</svg>`;
const png = new Resvg(sheet, { font: { loadSystemFonts: true } }).render().asPng();
const out = join(here, "mockups.png");
writeFileSync(out, png);
console.log(`wrote ${out} (${png.length} bytes, ${W}x${H})`);
