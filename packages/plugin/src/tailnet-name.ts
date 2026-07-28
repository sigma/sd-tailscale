// Which short tailnet name each button should display, given live daemon state.
//
// The rendering (baking the name into the icon) lives in button-image.ts; this
// module is the pure *selection* layer #31 wires into the three actions. Kept
// free of the SDK so it's unit-tested with plain data, like `exitNodeActive`.
//
// The rules come from #27 (name-only: a real short name or nothing, never a
// placeholder) and #28 (the plugin does all per-button selection):
//  - Exit Node / Copy IP show the *currently-active* tailnet.
//  - Connect shows the active tailnet when its configured profile is unset or is
//    the one already current; a different, not-yet-active profile has no
//    reliably-derivable short name, so it shows blank.

import { type Profile, shortTailnetName, type TailscaleStatus } from "@sd-tailscale/core";

/**
 * Short name of the currently-active tailnet (first DNS label of the MagicDNS
 * suffix), or `""` when there is none — logged out, daemon down, or binary
 * missing (all surface as a `null`/tailnet-less status). This is what Exit Node
 * and Copy IP display.
 */
export function activeTailnetName(status: TailscaleStatus | null): string {
  return shortTailnetName(status?.CurrentTailnet?.MagicDNSSuffix);
}

/**
 * The short name Connect should display for its configured `profile`, given live
 * `status` and the action's local `profiles` cache (see the Connect action;
 * refreshed off the poll).
 *
 * - `profile` unset (empty/whitespace) → the **active** tailnet name (#27's
 *   no-profile fallback).
 * - `profile` set and it is the currently-**current** profile (matched by the
 *   `id` or `account` the PI stores) → the **active** tailnet name.
 * - `profile` set but it is a *different*, not-yet-active profile — or the cache
 *   can't confirm it's current → **blank**. A non-active profile's tailnet has
 *   no reliably-derivable short name (the `switch --list` column is a display
 *   name/email, not the MagicDNS label — #25/#27), so per #27 we show nothing
 *   rather than guess.
 */
export function connectTailnetName(
  status: TailscaleStatus | null,
  profile: string | undefined,
  profiles: Profile[] | null,
): string {
  const active = activeTailnetName(status);
  const target = profile?.trim();
  if (!target) return active;

  const current = profiles?.find((p) => p.current);
  if (current && (current.id === target || current.account === target)) return active;
  return "";
}
