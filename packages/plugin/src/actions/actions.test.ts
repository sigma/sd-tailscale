import { TailscaleClient } from "@sd-tailscale/core";
import { describe, expect, it } from "vitest";

import { StatusMonitor } from "../monitor.js";
import { exitNodeActive } from "./exit-node-action.js";
import { buildActions, NAMESPACE } from "./index.js";

describe("buildActions", () => {
  it("wires the v1 action set with namespaced UUIDs", () => {
    const client = new TailscaleClient();
    const monitor = new StatusMonitor(client);
    const ids = buildActions(client, monitor).map(
      (a) => (a as unknown as { manifestId: string }).manifestId,
    );

    expect(ids).toEqual([`${NAMESPACE}.connect`, `${NAMESPACE}.exit-node`, `${NAMESPACE}.copy-ip`]);
  });
});

describe("exitNodeActive", () => {
  it("is false without a status or peers", () => {
    expect(exitNodeActive(null)).toBe(false);
    expect(exitNodeActive({})).toBe(false);
  });

  it("is true when a peer is serving as the exit node", () => {
    expect(exitNodeActive({ Peer: { a: { ExitNode: false }, b: { ExitNode: true } } })).toBe(true);
    expect(exitNodeActive({ Peer: { a: { ExitNode: false } } })).toBe(false);
  });
});
