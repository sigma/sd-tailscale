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

// The Connect Property Inspector asks for the profile list on load; reply with
// what the CLI reports so it can populate its dropdown. Non-getProfiles messages
// are ignored.
streamDeck.ui.onSendToPlugin(async (ev) => {
  const payload = ev.payload as { event?: string } | undefined;
  if (payload?.event !== "getProfiles") return;
  try {
    const profiles = await client.listProfiles();
    // The reply is plain JSON; cast to the SDK's payload type without importing
    // its bundled JsonValue (not re-exported from the entry).
    await streamDeck.ui.sendToPropertyInspector({
      event: "profiles",
      profiles,
    } as unknown as Parameters<typeof streamDeck.ui.sendToPropertyInspector>[0]);
  } catch (err) {
    streamDeck.logger.error(`listProfiles failed: ${(err as Error).message}`);
  }
});

streamDeck.connect();

// Start polling once connected so the first status push reaches painted keys.
monitor.start();
