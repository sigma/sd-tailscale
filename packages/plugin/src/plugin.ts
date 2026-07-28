import streamDeck from "@elgato/streamdeck";
import { TailscaleClient } from "@sd-tailscale/core";

import { buildActions } from "./actions/index.js";
import { StatusMonitor } from "./monitor.js";

// One shared client (default runner execs the host's `tailscale` binary) and one
// status monitor whose poll drives every LED.
const client = new TailscaleClient();
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
