import streamDeck, {
  type KeyDownEvent,
  SingletonAction,
  type WillAppearEvent,
} from "@elgato/streamdeck";
import type { TailscaleClient, TailscaleStatus } from "@sd-tailscale/core";

import type { StatusMonitor } from "../monitor.js";
import { renderButtonImageSafe } from "../render.js";
import { activeTailnetName } from "../tailnet-name.js";

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
  /**
   * Last painted signature per key instance (by `action.id`). The poll fires
   * this refresh every ~2s; we skip the `setState`/`setTitle`/`setImage` IPC
   * when nothing visible changed. Dropped on will-appear so a reappearing key
   * always repaints onto its fresh canvas. See {@link ConnectAction} for the
   * same pattern.
   */
  readonly #painted = new Map<string, string>();

  constructor(uuid: string, client: TailscaleClient, monitor: StatusMonitor) {
    super();
    (this as { manifestId: string }).manifestId = uuid;
    this.#client = client;
    this.#monitor = monitor;
    this.#monitor.onChange(() => this.#refresh());
  }

  override onWillAppear(ev: WillAppearEvent): void {
    this.#painted.delete(ev.action.id);
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
    const missing = this.#monitor.health === "binary-missing";
    const active = exitNodeActive(this.#monitor.latest);
    const state = active ? 0 : 1;
    const stem = active ? "exit_node_on" : "exit_node_off";
    const title = missing ? "No\nCLI" : "";
    const name = activeTailnetName(this.#monitor.latest);
    // No per-key settings, so every instance paints the same signature.
    const sig = `${state}\0${title}\0${name}`;
    const image = renderButtonImageSafe(stem, name);
    for (const action of this.actions) {
      if (!action.isKey()) continue;
      if (this.#painted.get(action.id) === sig) continue; // unchanged since last paint
      void action.setState(state);
      // See ConnectAction#refresh: mark "CLI not found" apart from daemon-down.
      void action.setTitle(title);
      // Target the current state so the state-specific base icon lands right.
      if (image) void action.setImage(image, { state });
      this.#painted.set(action.id, sig);
    }
  }
}
