import streamDeck from "@elgato/streamdeck";
import { detectTailscaleBinary, ExecFileRunner, TailscaleClient } from "@sd-tailscale/core";

import { buildActions } from "./actions/index.js";
import { StatusMonitor } from "./monitor.js";

// Resolve which `tailscale` binary to exec: an explicit `TAILSCALE_BINARY`, then
// the shell PATH, then the macOS app bundle (where the CLI ships off-PATH). If
// nothing is found we still point at bare `tailscale` so the first poll's ENOENT
// surfaces as the "binary-missing" key state rather than a silent no-op.
const bin = detectTailscaleBinary();
if (bin === null) {
  streamDeck.logger.warn("tailscale binary not found on PATH or in known locations");
}
const client = new TailscaleClient(new ExecFileRunner(bin ?? "tailscale"));
const monitor = new StatusMonitor(client, {
  log: (m) => streamDeck.logger.info(m),
});

for (const action of buildActions(client, monitor)) {
  streamDeck.actions.registerAction(action);
}

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

// Start polling once connected so the first status push reaches painted keys.
monitor.start();
