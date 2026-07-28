import { execFile } from "node:child_process";

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
