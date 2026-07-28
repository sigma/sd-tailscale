import streamDeck, { type KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import type { TailscaleClient } from "@sd-tailscale/core";

import { copyToClipboard } from "../clipboard.js";

/**
 * Copy this device's Tailscale IPv4 to the OS clipboard. Stateless button:
 * on press, read `tailscale ip -4` and hand it to the platform clipboard tool,
 * flashing OK / alert for feedback.
 */
export class CopyIpAction extends SingletonAction {
  readonly #client: TailscaleClient;

  constructor(uuid: string, client: TailscaleClient) {
    super();
    (this as { manifestId: string }).manifestId = uuid;
    this.#client = client;
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
}
