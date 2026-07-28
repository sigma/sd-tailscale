import type { TailscaleClient, TailscaleStatus } from "@sd-tailscale/core";
import { describe, expect, it, vi } from "vitest";

import { StatusMonitor } from "../monitor.js";

// Decouple the gating tests from real rasterization: a deterministic stand-in
// that just echoes its inputs, so we can observe *when* a key is repainted
// without depending on the committed PNGs or resvg.
vi.mock("../render.js", () => ({
  renderButtonImageSafe: (stem: string, name: string) => `img:${stem}:${name}`,
}));

import { ConnectAction } from "./connect-action.js";
import { CopyIpAction } from "./copy-ip-action.js";
import { ExitNodeAction } from "./exit-node-action.js";

/** A fake visible key that records the SDK repaint calls it receives. */
function fakeKey(id: string, settings: Record<string, unknown> = {}) {
  return {
    id,
    isKey: () => true,
    setImage: vi.fn(),
    setState: vi.fn(),
    setTitle: vi.fn(),
    getSettings: vi.fn(async () => settings),
  };
}

/** Wire `key` in as the action's single visible instance. */
function withKey<T extends object>(action: T, key: ReturnType<typeof fakeKey>): T {
  Object.defineProperty(action, "actions", { get: () => [key] });
  return action;
}

/** A monitor over a mutable status holder; `set(...)` then `refresh()` to fan out. */
function fakeMonitor() {
  let status: TailscaleStatus | null = null;
  const client = { status: async () => status } as unknown as TailscaleClient;
  const monitor = new StatusMonitor(client, { intervalMs: 1_000_000 });
  return {
    client,
    monitor,
    set(s: TailscaleStatus | null) {
      status = s;
    },
  };
}

const tailnet = (suffix: string): TailscaleStatus =>
  ({ CurrentTailnet: { MagicDNSSuffix: suffix } }) as unknown as TailscaleStatus;

describe("CopyIpAction repaint gating", () => {
  it("repaints only when the tailnet name changes across polls", async () => {
    const { client, monitor, set } = fakeMonitor();
    const key = fakeKey("k1");
    withKey(new CopyIpAction("copy-ip", client, monitor), key);

    set(tailnet("van-scylla.ts.net"));
    await monitor.refresh();
    expect(key.setImage).toHaveBeenCalledTimes(1); // first paint

    await monitor.refresh(); // same name → gated
    expect(key.setImage).toHaveBeenCalledTimes(1);

    set(tailnet("other-net.ts.net"));
    await monitor.refresh(); // name moved → repaint
    expect(key.setImage).toHaveBeenCalledTimes(2);
  });

  it("forces a repaint on will-appear even when the name is unchanged", async () => {
    const { client, monitor, set } = fakeMonitor();
    const key = fakeKey("k1");
    const action = withKey(new CopyIpAction("copy-ip", client, monitor), key);

    set(tailnet("van-scylla.ts.net"));
    await monitor.refresh();
    expect(key.setImage).toHaveBeenCalledTimes(1);

    action.onWillAppear({ action: { id: "k1" } } as never); // fresh canvas → drop the gate
    expect(key.setImage).toHaveBeenCalledTimes(2);
  });
});

describe("ExitNodeAction repaint gating", () => {
  it("skips the setState/setImage IPC on an unchanged poll", async () => {
    const { client, monitor, set } = fakeMonitor();
    const key = fakeKey("k1");
    withKey(new ExitNodeAction("exit-node", client, monitor), key);

    set(tailnet("van-scylla.ts.net")); // no active exit node → state 1
    await monitor.refresh();
    expect(key.setState).toHaveBeenCalledTimes(1);
    expect(key.setImage).toHaveBeenCalledTimes(1);

    await monitor.refresh(); // nothing changed → fully gated
    expect(key.setState).toHaveBeenCalledTimes(1);
    expect(key.setImage).toHaveBeenCalledTimes(1);
  });
});

describe("ConnectAction repaint gating", () => {
  // Connect's poll listener is fire-and-forget async (it awaits getSettings per
  // key), so drain the microtask queue after each refresh before asserting.
  const tick = () => new Promise((r) => setTimeout(r, 0));

  it("repaints when the connected state flips, not on steady polls", async () => {
    const { client, monitor, set } = fakeMonitor();
    const key = fakeKey("k1");
    withKey(new ConnectAction("connect", client, monitor), key);

    set({ BackendState: "Stopped" } as unknown as TailscaleStatus);
    await monitor.refresh();
    await tick();
    expect(key.setState).toHaveBeenCalledTimes(1);
    expect(key.setState).toHaveBeenLastCalledWith(1); // disconnected

    await monitor.refresh(); // still stopped → gated
    await tick();
    expect(key.setState).toHaveBeenCalledTimes(1);

    set({ BackendState: "Running" } as unknown as TailscaleStatus);
    await monitor.refresh(); // came up → repaint
    await tick();
    expect(key.setState).toHaveBeenCalledTimes(2);
    expect(key.setState).toHaveBeenLastCalledWith(0); // connected
  });
});
