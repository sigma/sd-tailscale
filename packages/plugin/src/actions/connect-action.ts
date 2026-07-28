import streamDeck, {
  type KeyDownEvent,
  SingletonAction,
  type WillAppearEvent,
} from "@elgato/streamdeck";
import type { TailscaleClient } from "@sd-tailscale/core";

import type { StatusMonitor } from "../monitor.js";

/** Per-key settings written by the connect Property Inspector. */
interface ConnectSettings {
  /** Login profile (id or name) to switch to before `up`. Empty = current. */
  profile?: string;
}

/**
 * Connect / disconnect the tailnet, with optional account switching.
 *
 * LED: state 0 = connected (Running), state 1 = disconnected. Because automatic
 * state cycling would fight the real daemon state, the manifest sets
 * `DisableAutomaticStates`; {@link StatusMonitor} drives the LED instead.
 *
 * Press semantics: if connected, `down`. If disconnected, switch to the
 * configured profile (when set) then `up`.
 */
export class ConnectAction extends SingletonAction {
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
    const connected = this.#monitor.latest?.BackendState === "Running";
    try {
      if (connected) {
        await this.#client.down();
      } else {
        const profile = (ev.payload.settings as ConnectSettings).profile?.trim();
        if (profile) await this.#client.switchProfile(profile);
        await this.#client.up();
      }
      await this.#monitor.refresh();
    } catch (err) {
      streamDeck.logger.error(`connect toggle failed: ${(err as Error).message}`);
      await ev.action.showAlert();
    }
  }

  #refresh(): void {
    const missing = this.#monitor.health === "binary-missing";
    const connected = this.#monitor.latest?.BackendState === "Running";
    for (const action of this.actions) {
      if (!action.isKey()) continue;
      void action.setState(connected ? 0 : 1);
      // Overlay a marker when the CLI can't be found — distinct from the plain
      // disconnected LED that means the daemon is merely down. Cleared on recovery.
      void action.setTitle(missing ? "No\nCLI" : "");
    }
  }
}
