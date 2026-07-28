import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { resolveTailscaleBinary } from "./runner.js";

/** Build a resolution env whose `isExecutable` accepts only the given paths. */
function env(
  overrides: {
    platform?: NodeJS.Platform;
    path?: string;
    override?: string;
    executable?: string[];
  } = {},
) {
  const executable = new Set(overrides.executable ?? []);
  return {
    platform: overrides.platform ?? "darwin",
    path: overrides.path,
    override: overrides.override,
    isExecutable: (candidate: string) => executable.has(candidate),
  };
}

describe("resolveTailscaleBinary", () => {
  it("trusts a non-empty override before probing anything", () => {
    expect(resolveTailscaleBinary(env({ override: " /opt/ts " }))).toBe("/opt/ts");
  });

  it("ignores a blank override and falls through", () => {
    expect(resolveTailscaleBinary(env({ override: "  " }))).toBeNull();
  });

  it("returns the bare name when found on PATH", () => {
    const resolved = resolveTailscaleBinary(
      env({ path: "/usr/bin:/usr/local/bin", executable: [join("/usr/local/bin", "tailscale")] }),
    );
    expect(resolved).toBe("tailscale");
  });

  it("falls back to the macOS app bundle when not on PATH", () => {
    const bundle = "/Applications/Tailscale.app/Contents/MacOS/Tailscale";
    const resolved = resolveTailscaleBinary(
      env({ platform: "darwin", path: "/usr/bin", executable: [bundle] }),
    );
    expect(resolved).toBe(bundle);
  });

  it("uses the .exe name and Windows fallback on win32", () => {
    // Build the PATH entry with the same join the resolver uses, so the test is
    // host-agnostic (node:path is posix on this runner, win32 on Windows). Keep
    // the dir free of `:` so it survives the posix PATH delimiter split here.
    const dir = "/opt/bin";
    expect(
      resolveTailscaleBinary(
        env({ platform: "win32", path: dir, executable: [join(dir, "tailscale.exe")] }),
      ),
    ).toBe("tailscale.exe");
    // Off PATH, via the installer location:
    const exe = "C:\\Program Files\\Tailscale\\tailscale.exe";
    expect(resolveTailscaleBinary(env({ platform: "win32", path: dir, executable: [exe] }))).toBe(
      exe,
    );
  });

  it("returns null when the CLI is nowhere to be found", () => {
    expect(resolveTailscaleBinary(env({ platform: "darwin", path: "/usr/bin" }))).toBeNull();
  });
});
