import streamDeck, {
  type KeyDownEvent,
  SingletonAction,
  type WillAppearEvent,
} from "@elgato/streamdeck";
import type { TailscaleClient } from "@sd-tailscale/core";

import { copyToClipboard } from "../clipboard.js";
import type { StatusMonitor } from "../monitor.js";
import { renderButtonImageSafe } from "../render.js";
import { activeTailnetName } from "../tailnet-name.js";

/**
 * Copy this device's Tailscale IPv4 to the OS clipboard. Stateless button:
 * on press, read `tailscale ip -4` and hand it to the platform clipboard tool,
 * flashing OK / alert for feedback.
 *
 * The press path needs no daemon state, but the button also shows the active
 * tailnet name (baked into its icon), so it takes the shared {@link StatusMonitor}
 * purely to repaint that strip as the tailnet changes.
 */
export class CopyIpAction extends SingletonAction {
  readonly #client: TailscaleClient;
  readonly #monitor: StatusMonitor;
  /**
   * Last painted name per key instance (by `action.id`). The `StatusMonitor`
   * fires this refresh every ~2s, but this button's only visible input is the
   * tailnet name, which changes only on an account switch — so we skip the
   * `setImage` IPC on every unchanged tick and repaint solely when the name
   * actually moves. A key is dropped from the map on will-appear so it always
   * repaints onto its fresh canvas.
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
    try {
      const ip = await this.#client.ip(4);
      if (!ip) {
        await ev.action.showAlert();
        return;
      }
      await copyToClipboard(ip);
      await ev.action.showOk();
    } catch (err) {
      streamDeck.logger.error(`copy ip failed: ${(err as Error).message}`);
      await ev.action.showAlert();
    }
  }

  #refresh(): void {
    // Single-state action: just repaint the copy-ip icon with the active tailnet
    // name baked on (blank strip → plain icon when there's no name).
    const name = activeTailnetName(this.#monitor.latest);
    for (const action of this.actions) {
      if (!action.isKey()) continue;
      if (this.#painted.get(action.id) === name) continue; // unchanged since last paint
      const image = renderButtonImageSafe("copy_ip", name);
      if (!image) continue;
      void action.setImage(image);
      this.#painted.set(action.id, name);
    }
  }
}
