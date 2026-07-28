import type { TailscaleClient, TailscaleStatus } from "@sd-tailscale/core";

type Listener = (status: TailscaleStatus | null) => void;

/**
 * Why the last poll produced no status. `"ok"` when the daemon answered;
 * `"daemon-down"` when the CLI ran but errored (daemon stopped, not logged in);
 * `"binary-missing"` when the `tailscale` binary couldn't be spawned at all — a
 * distinct failure the keys surface differently (see {@link classifyPollError}).
 */
export type MonitorHealth = "ok" | "daemon-down" | "binary-missing";

/**
 * Classify a failed poll. A spawn failure (the binary not on PATH / not
 * executable) rejects with a Node `errno` string like `ENOENT`; a non-zero exit
 * surfaces as {@link TailscaleError} carrying a numeric exit `code`. Only the
 * former means the binary itself is unreachable.
 */
export function classifyPollError(err: unknown): MonitorHealth {
  const code = (err as { code?: unknown } | null)?.code;
  return code === "ENOENT" || code === "EACCES" ? "binary-missing" : "daemon-down";
}

/**
 * Polls `tailscale status` on a fixed cadence and fans the result out to the
 * actions so their LEDs track the daemon. This is the plugin's single source of
 * truth for live state — Tailscale has no push channel, so we poll.
 *
 * `latest` is `null` until the first successful poll, and reverts to `null`
 * whenever a poll throws (daemon down / binary missing) so actions can render a
 * distinct "unknown" visual. {@link health} says *why* it's null so the keys can
 * tell "binary missing" apart from "daemon down".
 */
export class StatusMonitor {
  readonly #client: TailscaleClient;
  readonly #intervalMs: number;
  readonly #log: (message: string) => void;
  readonly #listeners = new Set<Listener>();
  #timer: ReturnType<typeof setInterval> | undefined;
  #latest: TailscaleStatus | null = null;
  #health: MonitorHealth = "ok";

  constructor(
    client: TailscaleClient,
    opts: { intervalMs?: number; log?: (message: string) => void } = {},
  ) {
    this.#client = client;
    this.#intervalMs = opts.intervalMs ?? 2000;
    this.#log = opts.log ?? (() => {});
  }

  get latest(): TailscaleStatus | null {
    return this.#latest;
  }

  /** Outcome of the most recent poll — see {@link MonitorHealth}. */
  get health(): MonitorHealth {
    return this.#health;
  }

  /** Register a listener; returns an unsubscribe function. */
  onChange(listener: Listener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /** Begin polling (fires an immediate refresh, then every `intervalMs`). */
  start(): void {
    if (this.#timer) return;
    void this.refresh();
    this.#timer = setInterval(() => void this.refresh(), this.#intervalMs);
  }

  stop(): void {
    if (this.#timer) clearInterval(this.#timer);
    this.#timer = undefined;
  }

  /** Poll once and notify listeners. Never rejects. */
  async refresh(): Promise<void> {
    try {
      this.#latest = await this.#client.status();
      this.#health = "ok";
    } catch (err) {
      this.#latest = null;
      this.#health = classifyPollError(err);
      this.#log(`tailscale status failed (${this.#health}): ${(err as Error).message}`);
    }
    for (const listener of this.#listeners) listener(this.#latest);
  }
}
