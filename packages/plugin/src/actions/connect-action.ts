import streamDeck, {
  type DidReceiveSettingsEvent,
  type KeyDownEvent,
  SingletonAction,
  type WillAppearEvent,
} from "@elgato/streamdeck";
import type { Profile, TailscaleClient } from "@sd-tailscale/core";

import type { StatusMonitor } from "../monitor.js";
import { renderButtonImageSafe } from "../render.js";
import { connectTailnetName } from "../tailnet-name.js";

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
 *
 * The button also displays the short tailnet name it's attached to: the active
 * tailnet when its `profile` is unset or already current, else blank (#27/#28,
 * see {@link connectTailnetName}). Deciding target-vs-current needs the profile
 * list, which the poll doesn't carry — so a *local* profiles cache is kept,
 * refreshed only on appear / settings-change / after this button's own
 * `up`/`switch`, and only when a profile is configured. Never on the 2s poll.
 */
export class ConnectAction extends SingletonAction {
  readonly #client: TailscaleClient;
  readonly #monitor: StatusMonitor;
  /** Local `switch --list` cache; see the class doc. `null` until first loaded. */
  #profiles: Profile[] | null = null;

  constructor(uuid: string, client: TailscaleClient, monitor: StatusMonitor) {
    super();
    (this as { manifestId: string }).manifestId = uuid;
    this.#client = client;
    this.#monitor = monitor;
    this.#monitor.onChange(() => void this.#refresh());
  }

  override async onWillAppear(ev: WillAppearEvent): Promise<void> {
    await this.#maybeRefreshProfiles(ev.payload.settings as ConnectSettings);
    await this.#refresh();
  }

  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent): Promise<void> {
    // The PI changed the target profile: reload the cache so target-vs-current
    // is judged against fresh data, then repaint.
    await this.#maybeRefreshProfiles(ev.payload.settings as ConnectSettings);
    await this.#refresh();
  }

  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    const connected = this.#monitor.latest?.BackendState === "Running";
    const profile = (ev.payload.settings as ConnectSettings).profile?.trim();
    try {
      if (connected) {
        await this.#client.down();
      } else {
        if (profile) await this.#client.switchProfile(profile);
        await this.#client.up();
      }
      // A `switch` moved the `current` marker, so refresh the cache before the
      // repaint that follows. Only meaningful when a profile is configured.
      if (profile) await this.#refreshProfiles();
      await this.#monitor.refresh();
    } catch (err) {
      streamDeck.logger.error(`connect toggle failed: ${(err as Error).message}`);
      await ev.action.showAlert();
    }
  }

  /** Reload the profiles cache, but only when a target profile is configured. */
  async #maybeRefreshProfiles(settings: ConnectSettings): Promise<void> {
    if (settings.profile?.trim()) await this.#refreshProfiles();
  }

  async #refreshProfiles(): Promise<void> {
    try {
      this.#profiles = await this.#client.listProfiles();
    } catch (err) {
      streamDeck.logger.error(`connect profiles refresh failed: ${(err as Error).message}`);
    }
  }

  async #refresh(): Promise<void> {
    const missing = this.#monitor.health === "binary-missing";
    const connected = this.#monitor.latest?.BackendState === "Running";
    const state = connected ? 0 : 1;
    const stem = connected ? "connected" : "disconnected";
    for (const action of this.actions) {
      if (!action.isKey()) continue;
      void action.setState(state);
      // Overlay a marker when the CLI can't be found — distinct from the plain
      // disconnected LED that means the daemon is merely down. Cleared on recovery.
      void action.setTitle(missing ? "No\nCLI" : "");
      // Name selection is per instance: each key can target a different profile.
      const { profile } = (await action.getSettings()) as ConnectSettings;
      const name = connectTailnetName(this.#monitor.latest, profile, this.#profiles);
      const image = renderButtonImageSafe(stem, name);
      if (image) void action.setImage(image, { state });
    }
  }
}
