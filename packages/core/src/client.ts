import { type CommandRunner, ExecFileRunner, TailscaleError } from "./runner.js";
import {
  type ExitNode,
  type Profile,
  parseExitNodes,
  parseProfiles,
  type TailscaleStatus,
} from "./status.js";

/**
 * A typed facade over the `tailscale` CLI. Every method turns into one
 * subcommand run through the injected {@link CommandRunner}, so the plugin —
 * and its tests — never touch `child_process` directly.
 *
 * This is the one module that knows Tailscale's command surface; actions stay
 * thin and speak in terms of these methods.
 */
export class TailscaleClient {
  readonly #runner: CommandRunner;

  constructor(runner: CommandRunner = new ExecFileRunner()) {
    this.#runner = runner;
  }

  /** Run a subcommand, throwing {@link TailscaleError} on a non-zero exit. */
  async #exec(args: string[]): Promise<string> {
    const result = await this.#runner.run(args);
    if (result.code !== 0) throw new TailscaleError(args, result);
    return result.stdout;
  }

  /** Current daemon status (`tailscale status --json`). */
  async status(): Promise<TailscaleStatus> {
    const out = await this.#exec(["status", "--json"]);
    return JSON.parse(out) as TailscaleStatus;
  }

  /** True when the backend is fully up and routing (`BackendState === "Running"`). */
  async isConnected(): Promise<boolean> {
    const status = await this.status();
    return status.BackendState === "Running";
  }

  /** Connect (`tailscale up`). */
  async up(): Promise<void> {
    await this.#exec(["up"]);
  }

  /** Disconnect (`tailscale down`). */
  async down(): Promise<void> {
    await this.#exec(["down"]);
  }

  /** This device's Tailscale IP. Family 4 (default) or 6. */
  async ip(family: 4 | 6 = 4): Promise<string> {
    const out = await this.#exec(["ip", family === 6 ? "-6" : "-4"]);
    // `ip` can print several addresses; the first line is this device's.
    return out.split("\n")[0]?.trim() ?? "";
  }

  /**
   * Route traffic through `node` (a peer IP or DNS name), or clear the exit node
   * when passed `null`.
   */
  async setExitNode(node: string | null): Promise<void> {
    await this.#exec(["set", node ? `--exit-node=${node}` : "--exit-node="]);
  }

  /**
   * List the peers currently advertising themselves as usable exit nodes,
   * derived from `tailscale status --json`.
   */
  async listExitNodes(): Promise<ExitNode[]> {
    return parseExitNodes(await this.status());
  }

  /** List login profiles (`tailscale switch --list`). */
  async listProfiles(): Promise<Profile[]> {
    const out = await this.#exec(["switch", "--list"]);
    return parseProfiles(out);
  }

  /** Switch to a login profile by id or name (`tailscale switch <profile>`). */
  async switchProfile(profile: string): Promise<void> {
    await this.#exec(["switch", profile]);
  }
}
