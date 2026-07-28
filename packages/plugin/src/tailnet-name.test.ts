import type { Profile, TailscaleStatus } from "@sd-tailscale/core";
import { describe, expect, it } from "vitest";

import { activeTailnetName, connectTailnetName } from "./tailnet-name.js";

const withTailnet = (suffix: string | undefined): TailscaleStatus => ({
  BackendState: "Running",
  CurrentTailnet: suffix === undefined ? undefined : { MagicDNSSuffix: suffix },
});

const profile = (over: Partial<Profile>): Profile => ({
  id: "id-x",
  tailnet: "tn",
  account: "acct@example.com",
  current: false,
  ...over,
});

describe("activeTailnetName", () => {
  it("is empty without a status", () => {
    expect(activeTailnetName(null)).toBe("");
  });

  it("is empty when the status has no current tailnet", () => {
    expect(activeTailnetName({ BackendState: "NeedsLogin" })).toBe("");
    expect(activeTailnetName(withTailnet(undefined))).toBe("");
  });

  it("is the first DNS label of the MagicDNS suffix", () => {
    expect(activeTailnetName(withTailnet("van-scylla.ts.net"))).toBe("van-scylla");
  });
});

describe("connectTailnetName", () => {
  const status = withTailnet("van-scylla.ts.net");

  it("falls back to the active tailnet when no profile is configured", () => {
    expect(connectTailnetName(status, undefined, null)).toBe("van-scylla");
    expect(connectTailnetName(status, "", null)).toBe("van-scylla");
    expect(connectTailnetName(status, "   ", null)).toBe("van-scylla");
  });

  it("shows the active tailnet when the configured profile is the current one", () => {
    const profiles = [
      profile({ id: "id-a", account: "a@x", current: false }),
      profile({ id: "id-b", account: "b@x", current: true }),
    ];
    // Matched by id (what the PI stores when id != "-")...
    expect(connectTailnetName(status, "id-b", profiles)).toBe("van-scylla");
    // ...or by account (what the PI stores when id == "-").
    expect(connectTailnetName(status, "b@x", profiles)).toBe("van-scylla");
  });

  it("is blank when the configured profile is a different, not-yet-active one", () => {
    const profiles = [
      profile({ id: "id-a", account: "a@x", current: false }),
      profile({ id: "id-b", account: "b@x", current: true }),
    ];
    expect(connectTailnetName(status, "id-a", profiles)).toBe("");
    expect(connectTailnetName(status, "a@x", profiles)).toBe("");
  });

  it("is blank when the cache can't confirm the target is current", () => {
    // No cache yet, or no current profile in it: can't prove it's active → blank.
    expect(connectTailnetName(status, "id-a", null)).toBe("");
    expect(connectTailnetName(status, "id-a", [])).toBe("");
    expect(connectTailnetName(status, "id-a", [profile({ id: "id-a", current: false })])).toBe("");
  });

  it("is blank when configured-and-current but there is no active tailnet", () => {
    const loggedOut: TailscaleStatus = { BackendState: "NeedsLogin" };
    const profiles = [profile({ id: "id-b", current: true })];
    expect(connectTailnetName(loggedOut, "id-b", profiles)).toBe("");
  });
});
