import { execFile } from "node:child_process";
import { accessSync, constants } from "node:fs";
import { delimiter, join } from "node:path";

/** Outcome of running a `tailscale` subcommand. */
export interface CommandResult {
  stdout: string;
  stderr: string;
  /** Process exit code (0 on success). */
  code: number;
}

/**
 * The seam between {@link TailscaleClient} and the outside world. Every call the
 * client makes goes through here, so tests inject a fake runner and never spawn
 * a real process. `args` is the argv passed to the `tailscale` binary (without
 * the binary name itself).
 */
export interface CommandRunner {
  run(args: string[]): Promise<CommandResult>;
}

/**
 * Default runner: execs the real `tailscale` binary with no shell (argv is
 * passed as an array, so nothing is word-split or glob-expanded). A non-zero
 * exit resolves normally with its `code` — the client decides what counts as a
 * failure. Only a spawn failure (e.g. binary not on PATH) rejects.
 */
export class ExecFileRunner implements CommandRunner {
  readonly #bin: string;

  constructor(bin = "tailscale") {
    this.#bin = bin;
  }

  run(args: string[]): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      execFile(this.#bin, args, { encoding: "utf8" }, (error, stdout, stderr) => {
        if (error && typeof (error as { code?: unknown }).code !== "number") {
          // Spawn failure (ENOENT, EACCES, …) — the binary never ran.
          reject(error);
          return;
        }
        const code = error ? ((error as { code?: number }).code ?? 1) : 0;
        resolve({ stdout, stderr, code });
      });
    });
  }
}

/**
 * Absolute locations the Tailscale CLI ships in but does **not** add to the
 * shell `PATH`, keyed by `process.platform`. On macOS the standalone / App Store
 * app bundles the CLI inside `Tailscale.app`; the Windows GUI installer drops it
 * under `Program Files`. When `tailscale` isn't on `PATH`, these are tried next.
 */
export const TAILSCALE_FALLBACK_PATHS: Partial<Record<NodeJS.Platform, string[]>> = {
  darwin: ["/Applications/Tailscale.app/Contents/MacOS/Tailscale"],
  win32: ["C:\\Program Files\\Tailscale\\tailscale.exe"],
};

/**
 * The inputs {@link resolveTailscaleBinary} needs, injected so the resolution
 * logic stays pure and unit-testable (no real filesystem or `process`).
 */
export interface BinaryResolution {
  /** Target platform, as `process.platform` reports it. */
  platform: NodeJS.Platform;
  /** The `PATH` string to scan (`process.env.PATH`); split on the OS delimiter. */
  path?: string;
  /** Explicit override (a setting or `TAILSCALE_BINARY`); wins when non-empty. */
  override?: string;
  /** Does an **executable** file exist at this absolute path? */
  isExecutable(candidate: string): boolean;
}

/**
 * Pick the `tailscale` binary to exec, resolving the common macOS case where the
 * CLI ships inside the app bundle and isn't on `PATH`. Order:
 *
 * 1. An explicit `override`, trusted as-is.
 * 2. `tailscale` on `PATH` — returns the bare name so `execFile` resolves it.
 * 3. A known {@link TAILSCALE_FALLBACK_PATHS bundled location} that exists.
 * 4. `null` when nothing is found — the caller decides how to surface that.
 */
export function resolveTailscaleBinary(env: BinaryResolution): string | null {
  const override = env.override?.trim();
  if (override) return override;

  const exeName = env.platform === "win32" ? "tailscale.exe" : "tailscale";
  for (const dir of (env.path ?? "").split(delimiter).filter(Boolean)) {
    if (env.isExecutable(join(dir, exeName))) return exeName;
  }

  for (const candidate of TAILSCALE_FALLBACK_PATHS[env.platform] ?? []) {
    if (env.isExecutable(candidate)) return candidate;
  }
  return null;
}

/** True when `path` names a file the current process may execute. */
function isExecutableFile(path: string): boolean {
  try {
    accessSync(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * {@link resolveTailscaleBinary} wired to the real host: scans the process
 * `PATH` and checks the bundled fallbacks on disk. `override` defaults to the
 * `TAILSCALE_BINARY` environment variable. Returns `null` when the CLI can't be
 * located anywhere.
 */
export function detectTailscaleBinary(override?: string): string | null {
  return resolveTailscaleBinary({
    platform: process.platform,
    path: process.env.PATH,
    override: override ?? process.env.TAILSCALE_BINARY,
    isExecutable: isExecutableFile,
  });
}

/** Thrown when a `tailscale` subcommand exits non-zero. */
export class TailscaleError extends Error {
  readonly args: string[];
  readonly code: number;
  readonly stderr: string;

  constructor(args: string[], result: CommandResult) {
    super(`tailscale ${args.join(" ")} exited ${result.code}: ${result.stderr.trim()}`);
    this.name = "TailscaleError";
    this.args = args;
    this.code = result.code;
    this.stderr = result.stderr;
  }
}
