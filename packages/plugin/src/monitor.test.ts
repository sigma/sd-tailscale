import type { CommandResult, CommandRunner } from "@sd-tailscale/core";
import { TailscaleClient } from "@sd-tailscale/core";
import { describe, expect, it } from "vitest";

import { classifyPollError, StatusMonitor } from "./monitor.js";

/** A runner that replays a scripted result or rejects with a scripted error. */
class ScriptedRunner implements CommandRunner {
  constructor(private readonly outcome: Partial<CommandResult> | Error) {}

  run(): Promise<CommandResult> {
    if (this.outcome instanceof Error) return Promise.reject(this.outcome);
    return Promise.resolve({ stdout: "", stderr: "", code: 0, ...this.outcome });
  }
}

function monitorOf(outcome: Partial<CommandResult> | Error): StatusMonitor {
  return new StatusMonitor(new TailscaleClient(new ScriptedRunner(outcome)));
}

describe("classifyPollError", () => {
  it("reads a spawn errno as binary-missing", () => {
    expect(classifyPollError(Object.assign(new Error(), { code: "ENOENT" }))).toBe(
      "binary-missing",
    );
    expect(classifyPollError(Object.assign(new Error(), { code: "EACCES" }))).toBe(
      "binary-missing",
    );
  });

  it("treats a numeric exit code (TailscaleError) as daemon-down", () => {
    expect(classifyPollError(Object.assign(new Error(), { code: 1 }))).toBe("daemon-down");
    expect(classifyPollError(new Error("bad json"))).toBe("daemon-down");
  });
});

describe("StatusMonitor health", () => {
  it("starts optimistic and reports ok after a successful poll", async () => {
    const monitor = monitorOf({ stdout: '{"BackendState":"Running"}' });
    expect(monitor.health).toBe("ok");

    await monitor.refresh();

    expect(monitor.health).toBe("ok");
    expect(monitor.latest?.BackendState).toBe("Running");
  });

  it("reports binary-missing when the binary can't be spawned", async () => {
    const monitor = monitorOf(Object.assign(new Error("spawn tailscale"), { code: "ENOENT" }));

    await monitor.refresh();

    expect(monitor.health).toBe("binary-missing");
    expect(monitor.latest).toBeNull();
  });

  it("reports daemon-down on a non-zero exit", async () => {
    const monitor = monitorOf({ code: 1, stderr: "Tailscale is stopped." });

    await monitor.refresh();

    expect(monitor.health).toBe("daemon-down");
    expect(monitor.latest).toBeNull();
  });

  it("recovers to ok once the daemon answers again", async () => {
    const monitor = monitorOf({ stdout: '{"BackendState":"Running"}' });
    await monitor.refresh();
    expect(monitor.health).toBe("ok");
  });
});
