import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it } from "vitest";

import {
  buttonImageRenderCount,
  clearButtonImageCache,
  compositeButtonImage,
  fitNameToStrip,
  type IconSize,
  renderButtonImage,
  toSetImageUri,
} from "./button-image.js";

// The committed action icons. At run time they sit beside the bundle
// (`bin/../imgs/actions/`); from the test's src/ location they're under the
// unbundled plugin dir, which we also hand renderButtonImage via its seam.
const ICONS_DIR = new URL("../dev.yrh.tailscale.sdPlugin/imgs/actions/", import.meta.url);

// A real committed base icon, so the resvg path gets a genuine PNG to composite
// onto rather than a synthetic one.
const baseIcon = (stem: string, size: IconSize): Buffer => {
  const suffix = size === 144 ? "@2x" : "";
  return readFileSync(new URL(`${stem}${suffix}.png`, ICONS_DIR));
};

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
const isPng = (buf: Buffer) => buf.subarray(0, 4).equals(PNG_MAGIC);

describe("fitNameToStrip", () => {
  it("keeps a short name at the max font size, unellipsized", () => {
    const { text, fontSize } = fitNameToStrip("van-scylla");
    expect(text).toBe("van-scylla");
    expect(fontSize).toBe(20);
  });

  it("shrinks the font for a name too wide at max size", () => {
    const short = fitNameToStrip("van-scylla").fontSize;
    const { text, fontSize } = fitNameToStrip("really-long-tailnet");
    expect(text).toBe("really-long-tailnet"); // still whole, just smaller
    expect(fontSize).toBeLessThan(short);
    expect(fontSize).toBeGreaterThanOrEqual(11);
  });

  it("ellipsizes at the floor when even the min font overflows", () => {
    const { text, fontSize } = fitNameToStrip("this-name-is-absurdly-long-and-keeps-going");
    expect(fontSize).toBe(11); // pinned to the floor
    expect(text.endsWith("…")).toBe(true);
    expect(text.length).toBeLessThan("this-name-is-absurdly-long-and-keeps-going".length);
  });
});

describe("compositeButtonImage", () => {
  it("returns the plain base icon unchanged when the name is empty", () => {
    const base = baseIcon("connected", 144);
    expect(compositeButtonImage(base, "", 144)).toBe(base);
    expect(compositeButtonImage(base, "   ", 144)).toBe(base); // whitespace-only too
  });

  it("bakes a strip in — a different, valid PNG — when a name resolves", () => {
    const base = baseIcon("connected", 144);
    const out = compositeButtonImage(base, "van-scylla", 144);
    expect(isPng(out)).toBe(true);
    expect(out.length).toBeGreaterThan(0);
    expect(out.equals(base)).toBe(false);
  });

  it("renders both key sizes to non-empty PNGs", () => {
    for (const size of [72, 144] as const) {
      const out = compositeButtonImage(baseIcon("exit_node_on", size), "van-scylla", size);
      expect(isPng(out)).toBe(true);
      expect(out.length).toBeGreaterThan(0);
    }
  });

  it("handles a long name (shrink/ellipsis path) without throwing", () => {
    const out = compositeButtonImage(baseIcon("copy_ip", 144), "really-long-tailnet-name", 144);
    expect(isPng(out)).toBe(true);
  });
});

describe("toSetImageUri", () => {
  it("wraps a PNG buffer as a base64 data URI", () => {
    const uri = toSetImageUri(Buffer.from([0x89, 0x50]));
    expect(uri).toBe("data:image/png;base64,iVA=");
  });
});

describe("renderButtonImage caching", () => {
  beforeEach(() => clearButtonImageCache());

  it("renders once per distinct (stem, name, size) and serves repeats from cache", () => {
    const first = renderButtonImage("connected", "van-scylla", 144, ICONS_DIR);
    expect(buttonImageRenderCount()).toBe(1);

    const second = renderButtonImage("connected", "van-scylla", 144, ICONS_DIR);
    expect(second).toBe(first); // identical output...
    expect(buttonImageRenderCount()).toBe(1); // ...and no second render (the poll's hot path)
  });

  it("treats a changed name, stem, or size as a distinct key", () => {
    renderButtonImage("connected", "van-scylla", 144, ICONS_DIR);
    renderButtonImage("connected", "other-net", 144, ICONS_DIR); // name changed
    renderButtonImage("disconnected", "van-scylla", 144, ICONS_DIR); // stem changed
    renderButtonImage("connected", "van-scylla", 72, ICONS_DIR); // size changed
    expect(buttonImageRenderCount()).toBe(4);

    renderButtonImage("connected", "van-scylla", 144, ICONS_DIR); // back to the first key
    expect(buttonImageRenderCount()).toBe(4); // still a hit
  });
});

describe("renderButtonImage", () => {
  beforeEach(() => clearButtonImageCache());

  it("resolves a committed base icon and returns a setImage data URI", () => {
    const uri = renderButtonImage("connected", "van-scylla", 144, ICONS_DIR);
    expect(uri.startsWith("data:image/png;base64,")).toBe(true);
    const png = Buffer.from(uri.slice("data:image/png;base64,".length), "base64");
    expect(isPng(png)).toBe(true);
  });

  it("passes the plain base icon through when there is no name", () => {
    const uri = renderButtonImage("copy_ip", "", 72, ICONS_DIR);
    const png = Buffer.from(uri.slice("data:image/png;base64,".length), "base64");
    expect(png.equals(baseIcon("copy_ip", 72))).toBe(true);
  });
});
