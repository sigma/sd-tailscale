/**
 * A minimal, purpose-built view of `tailscale status --json`. We model only the
 * fields the plugin actually reads; the index signatures keep the rest of the
 * (large, versioned) payload accessible without pinning it all down here.
 */

/** Daemon backend state, as reported in `BackendState`. */
export type BackendState =
  | "NoState"
  | "NeedsLogin"
  | "NeedsMachineAuth"
  | "Stopped"
  | "Starting"
  | "Running";

export interface PeerStatus {
  ID?: string;
  HostName?: string;
  DNSName?: string;
  TailscaleIPs?: string[];
  Online?: boolean;
  /** True when this peer is currently acting as our exit node. */
  ExitNode?: boolean;
  /** True when this peer advertises itself as a usable exit node. */
  ExitNodeOption?: boolean;
  [key: string]: unknown;
}

export interface TailscaleStatus {
  Version?: string;
  BackendState?: BackendState;
  Self?: PeerStatus;
  Peer?: Record<string, PeerStatus>;
  CurrentTailnet?: {
    Name?: string;
    MagicDNSSuffix?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/** A peer usable as an exit node, distilled from `tailscale status --json`. */
export interface ExitNode {
  /** Human label: the peer's `HostName`, falling back to its DNS name; empty when it has neither. */
  label: string;
  /** The peer's Tailscale IPv4 to route through (the value passed to `set --exit-node`). */
  ip: string;
  /** True when this peer is currently serving as our exit node. */
  active: boolean;
}

/**
 * Distill the usable exit nodes from a status payload: peers advertising
 * `ExitNodeOption`. Sorted by how they'll be shown (label, or IP when unnamed)
 * for a stable dropdown. Mirrors what {@link parseProfiles} does for Connect.
 */
export function parseExitNodes(status: TailscaleStatus | null): ExitNode[] {
  const peers = status?.Peer;
  if (!peers) return [];
  const nodes: ExitNode[] = [];
  for (const peer of Object.values(peers)) {
    if (peer.ExitNodeOption !== true) continue;
    const ip = peer.TailscaleIPs?.[0] ?? "";
    // Trim MagicDNS's trailing dot so the label reads as a plain hostname.
    const dnsName = peer.DNSName?.replace(/\.$/, "");
    const label = peer.HostName || dnsName || "";
    nodes.push({ label, ip, active: peer.ExitNode === true });
  }
  return nodes.sort((a, b) => (a.label || a.ip).localeCompare(b.label || b.ip));
}

/** A login profile as listed by `tailscale switch --list`. */
export interface Profile {
  id: string;
  tailnet: string;
  account: string;
  /** True for the profile currently in use (marked with `*` in the CLI). */
  current: boolean;
}

/**
 * Parse the tabular output of `tailscale switch --list`. The CLI prints a header
 * row plus one whitespace-aligned row per profile; the active profile's account
 * is suffixed with `*`. Columns are separated by runs of two-or-more spaces.
 */
export function parseProfiles(stdout: string): Profile[] {
  const profiles: Profile[] = [];
  for (const line of stdout.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "") continue;
    const cols = trimmed.split(/\s{2,}/);
    if (cols.length < 3) continue;
    const [id, tailnet, rawAccount] = cols;
    // Skip the header row.
    if (id === "ID" && tailnet === "Tailnet") continue;
    const current = rawAccount.endsWith("*");
    const account = current ? rawAccount.slice(0, -1) : rawAccount;
    profiles.push({ id, tailnet, account, current });
  }
  return profiles;
}
