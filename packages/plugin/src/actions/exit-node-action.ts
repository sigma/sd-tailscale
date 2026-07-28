import streamDeck, {
  type KeyDownEvent,
  SingletonAction,
  type WillAppearEvent,
} from "@elgato/streamdeck";
import type { TailscaleClient, TailscaleStatus } from "@sd-tailscale/core";

import type { StatusMonitor } from "../monitor.js";

/** Per-key settings written by the exit-node Property Inspector. */
interface ExitNodeSettings {
  /** The exit node to route through (peer IP or MagicDNS name). */
  exitNode?: string;
}

/** True when any peer is currently serving as our exit node. */
export function exitNodeActive(status: TailscaleStatus | null): boolean {
  if (!status?.Peer) return false;
  return Object.values(status.Peer).some((peer) => peer.ExitNode === true);
}

/**
 * Toggle routing through a configured exit node.
 *
 * LED: state 0 = active (routing through the exit node), state 1 = off. Driven
 * by {@link StatusMonitor}, so the manifest sets `DisableAutomaticStates`.
 */
export class ExitNodeAction extends SingletonAction {
  readonly #client: TailscaleClient;
  readonly #monitor: StatusMonitor;

  constructor(uuid: string, client: TailscaleClient, monitor: StatusMonitor) {
    super();
    (this as { manifestId: string }).manifestId = uuid;
    this.#client = client;
    this.#monitor = monitor;
    this.#monitor.onChange(() => this.#refresh());
  }

  override onWillAppear(_ev: WillAppearEvent): void {
    this.#refresh();
  }

  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    const active = exitNodeActive(this.#monitor.latest);
    const node = (ev.payload.settings as ExitNodeSettings).exitNode?.trim();
    try {
      if (active) {
        await this.#client.setExitNode(null);
      } else if (node) {
        await this.#client.setExitNode(node);
      } else {
        // Nothing configured to turn on.
        await ev.action.showAlert();
        return;
      }
      await this.#monitor.refresh();
    } catch (err) {
      streamDeck.logger.error(`exit-node toggle failed: ${(err as Error).message}`);
      await ev.action.showAlert();
    }
  }

  #refresh(): void {
    const active = exitNodeActive(this.#monitor.latest);
    for (const action of this.actions) {
      if (action.isKey()) void action.setState(active ? 0 : 1);
    }
  }
}
