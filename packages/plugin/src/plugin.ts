import streamDeck from "@elgato/streamdeck";
import { detectTailscaleBinary, ExecFileRunner, TailscaleClient } from "@sd-tailscale/core";

import { buildActions } from "./actions/index.js";
import { StatusMonitor } from "./monitor.js";

// Global (plugin-wide) settings, shared by every action's Property Inspector.
// The SDK's `JsonObject` constraint isn't re-exported from the entry, so we read
// the field by casting (as the PI-message handlers below already do) rather than
// parameterizing the settings generic.
interface GlobalSettings {
  /** Explicit path to the `tailscale` CLI. Empty/undefined = auto-detect. */
  binaryPath?: string;
}

// The binary the runner execs. Re-resolved from settings (see applyBinary) and
// read live on every command, so editing the path in a Property Inspector takes
// effect without restarting the plugin. We start at bare `tailscale` so the
// first poll's ENOENT surfaces as the "binary-missing" key state, not a no-op.
let currentBin = "tailscale";
const client = new TailscaleClient(new ExecFileRunner(() => currentBin));
const monitor = new StatusMonitor(client, {
  log: (m) => streamDeck.logger.info(m),
});

// Resolve which `tailscale` binary to exec: the user's explicit override (from
// the Property Inspector), then `TAILSCALE_BINARY`, then the shell PATH, then the
// macOS app bundle (where the CLI ships off-PATH). Falls back to bare `tailscale`
// when nothing is found so the missing-CLI state still surfaces.
function applyBinary(override?: string): void {
  const resolved = detectTailscaleBinary(override?.trim() || undefined);
  if (resolved === null) {
    streamDeck.logger.warn("tailscale binary not found on PATH or in known locations");
  }
  currentBin = resolved ?? "tailscale";
}

for (const action of buildActions(client, monitor)) {
  streamDeck.actions.registerAction(action);
}

// Re-resolve the binary whenever the global settings change (a Property
// Inspector edited the path) and poll immediately so the keys reflect the new
// binary without waiting for the next tick.
streamDeck.settings.onDidReceiveGlobalSettings((ev) => {
  applyBinary((ev.settings as GlobalSettings).binaryPath);
  void monitor.refresh();
});

// A Property Inspector asks for a list on load; reply with what the CLI reports
// so it can populate its dropdown. The Connect PI wants profiles; the Exit Node
// PI wants the peers usable as exit nodes. Other messages are ignored.
//
// The replies are plain JSON; cast to the SDK's payload type without importing
// its bundled JsonValue (not re-exported from the entry).
type PIPayload = Parameters<typeof streamDeck.ui.sendToPropertyInspector>[0];
streamDeck.ui.onSendToPlugin(async (ev) => {
  const payload = ev.payload as { event?: string } | undefined;
  try {
    if (payload?.event === "getProfiles") {
      const profiles = await client.listProfiles();
      await streamDeck.ui.sendToPropertyInspector({
        event: "profiles",
        profiles,
      } as unknown as PIPayload);
    } else if (payload?.event === "getExitNodes") {
      const exitNodes = await client.listExitNodes();
      await streamDeck.ui.sendToPropertyInspector({
        event: "exitNodes",
        exitNodes,
      } as unknown as PIPayload);
    }
  } catch (err) {
    streamDeck.logger.error(`${payload?.event} failed: ${(err as Error).message}`);
  }
});

streamDeck.connect();

// Seed the binary from any saved override before the first poll, then start
// polling so the first status push reaches painted keys.
void streamDeck.settings
  .getGlobalSettings()
  .then((settings) => applyBinary((settings as GlobalSettings).binaryPath))
  .catch((err) => streamDeck.logger.warn(`getGlobalSettings failed: ${(err as Error).message}`))
  .finally(() => monitor.start());
