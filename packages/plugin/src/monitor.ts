import type { TailscaleClient, TailscaleStatus } from "@sd-tailscale/core";

type Listener = (status: TailscaleStatus | null) => void;

/**
 * Polls `tailscale status` on a fixed cadence and fans the result out to the
 * actions so their LEDs track the daemon. This is the plugin's single source of
 * truth for live state — Tailscale has no push channel, so we poll.
 *
 * `latest` is `null` until the first successful poll, and reverts to `null`
 * whenever a poll throws (daemon down / binary missing) so actions can render a
 * distinct "unknown" visual.
 */
export class StatusMonitor {
  readonly #client: TailscaleClient;
  readonly #intervalMs: number;
  readonly #log: (message: string) => void;
  readonly #listeners = new Set<Listener>();
  #timer: ReturnType<typeof setInterval> | undefined;
  #latest: TailscaleStatus | null = null;

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
    } catch (err) {
      this.#latest = null;
      this.#log(`tailscale status failed: ${(err as Error).message}`);
    }
    for (const listener of this.#listeners) listener(this.#latest);
  }
}
