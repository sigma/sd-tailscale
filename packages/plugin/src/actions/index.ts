import type { SingletonAction } from "@elgato/streamdeck";
import type { TailscaleClient } from "@sd-tailscale/core";

import type { StatusMonitor } from "../monitor.js";
import { ConnectAction } from "./connect-action.js";
import { CopyIpAction } from "./copy-ip-action.js";
import { ExitNodeAction } from "./exit-node-action.js";

/** Plugin action namespace; every action UUID is `${NAMESPACE}.<key>`. */
export const NAMESPACE = "dev.yrh.tailscale";

const uuid = (key: string) => `${NAMESPACE}.${key}`;

/**
 * Build every plugin action, wired to the shared client and status monitor.
 * This is the single source of truth for the action set — the hand-written
 * manifest must list a matching `Actions[]` entry per UUID.
 */
export function buildActions(client: TailscaleClient, monitor: StatusMonitor): SingletonAction[] {
  return [
    new ConnectAction(uuid("connect"), client, monitor),
    new ExitNodeAction(uuid("exit-node"), client, monitor),
    new CopyIpAction(uuid("copy-ip"), client, monitor),
  ];
}
