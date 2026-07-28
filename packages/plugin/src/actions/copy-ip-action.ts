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
    const image = renderButtonImageSafe("copy_ip", activeTailnetName(this.#monitor.latest));
    if (!image) return;
    for (const action of this.actions) {
      if (!action.isKey()) continue;
      void action.setImage(image);
    }
  }
}
