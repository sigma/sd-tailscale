import { spawn } from "node:child_process";

import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

const uuid = "dev.yrh.tailscale";
const sdPlugin = `${uuid}.sdPlugin`;
const isWatching = !!process.env.ROLLUP_WATCH;

/**
 * In watch mode, restart just this plugin in Stream Deck after every rebuild —
 * this is what turns `rollup -w` into a hot-reload loop. `streamdeck` is on PATH
 * because npm scripts prepend node_modules/.bin.
 */
const reloadPlugin = {
  name: "streamdeck-reload",
  writeBundle() {
    spawn("streamdeck", ["restart", uuid], { stdio: "inherit", shell: true });
  },
};

/**
 * Bundle the plugin into a single ESM file under the .sdPlugin/bin folder that
 * `manifest.json`'s CodePath points at. `@sd-tailscale/core` is pulled in from
 * its built dist by nodeResolve, so run `pnpm -r build` (core first) — or rely
 * on watch mode rebuilding after `just build`.
 */
export default {
  input: "src/plugin.ts",
  output: {
    file: `${sdPlugin}/bin/plugin.js`,
    sourcemap: isWatching,
  },
  // `@resvg/resvg-js` is a *native* module — Rollup would try to inline its
  // `.node` binary and choke. Keep it external so the bundle emits a bare
  // `import` that Node resolves from the hoisted workspace node_modules at run
  // time. (Redistributable packaging of the .node binary is out of scope — see
  // issue #24's body / #33.)
  external: [/@resvg\/resvg-js/],
  plugins: [
    typescript(),
    nodeResolve({ browser: false, exportConditions: ["node"], preferBuiltins: true }),
    commonjs(),
    json(),
    isWatching && reloadPlugin,
  ],
};
