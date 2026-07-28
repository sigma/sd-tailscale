import { describe, expect, it } from "vitest";

import { TailscaleClient } from "./client.js";
import type { CommandResult, CommandRunner } from "./runner.js";
import { parseProfiles } from "./status.js";

/** A runner that records the argv it saw and replays a scripted result. */
class FakeRunner implements CommandRunner {
  calls: string[][] = [];
  #result: CommandResult;

  constructor(result: Partial<CommandResult> = {}) {
    this.#result = { stdout: "", stderr: "", code: 0, ...result };
  }

  run(args: string[]): Promise<CommandResult> {
    this.calls.push(args);
    return Promise.resolve(this.#result);
  }
}

describe("TailscaleClient", () => {
  it("parses status --json", async () => {
    const runner = new FakeRunner({
      stdout: JSON.stringify({ BackendState: "Running", Self: { HostName: "laptop" } }),
    });
    const client = new TailscaleClient(runner);

    const status = await client.status();

    expect(runner.calls).toEqual([["status", "--json"]]);
    expect(status.BackendState).toBe("Running");
    expect(status.Self?.HostName).toBe("laptop");
  });

  it("reports connection from BackendState", async () => {
    const running = new TailscaleClient(new FakeRunner({ stdout: '{"BackendState":"Running"}' }));
    const stopped = new TailscaleClient(new FakeRunner({ stdout: '{"BackendState":"Stopped"}' }));

    expect(await running.isConnected()).toBe(true);
    expect(await stopped.isConnected()).toBe(false);
  });

  it("issues up and down", async () => {
    const up = new FakeRunner();
    await new TailscaleClient(up).up();
    expect(up.calls).toEqual([["up"]]);

    const down = new FakeRunner();
    await new TailscaleClient(down).down();
    expect(down.calls).toEqual([["down"]]);
  });

  it("sets and clears the exit node", async () => {
    const set = new FakeRunner();
    await new TailscaleClient(set).setExitNode("100.64.0.1");
    expect(set.calls).toEqual([["set", "--exit-node=100.64.0.1"]]);

    const clear = new FakeRunner();
    await new TailscaleClient(clear).setExitNode(null);
    expect(clear.calls).toEqual([["set", "--exit-node="]]);
  });

  it("returns the first line of ip", async () => {
    const runner = new FakeRunner({ stdout: "100.64.0.5\nfd7a::5\n" });
    const client = new TailscaleClient(runner);

    expect(await client.ip()).toBe("100.64.0.5");
    expect(runner.calls).toEqual([["ip", "-4"]]);
  });

  it("switches profiles", async () => {
    const runner = new FakeRunner();
    await new TailscaleClient(runner).switchProfile("work");
    expect(runner.calls).toEqual([["switch", "work"]]);
  });

  it("throws on a non-zero exit", async () => {
    const runner = new FakeRunner({ code: 1, stderr: "not logged in" });
    await expect(new TailscaleClient(runner).up()).rejects.toThrow(/not logged in/);
  });
});

describe("parseProfiles", () => {
  it("parses the switch --list table and flags the current profile", () => {
    const out = [
      "ID          Tailnet               Account",
      "-           personal.ts.net       alice@gmail.com*",
      "abc123XYZ   corp.ts.net           alice@corp.example",
      "",
    ].join("\n");

    expect(parseProfiles(out)).toEqual([
      { id: "-", tailnet: "personal.ts.net", account: "alice@gmail.com", current: true },
      { id: "abc123XYZ", tailnet: "corp.ts.net", account: "alice@corp.example", current: false },
    ]);
  });

  it("returns nothing for empty output", () => {
    expect(parseProfiles("")).toEqual([]);
  });
});
