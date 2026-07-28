export { TailscaleClient } from "./client.js";
export {
  type BinaryResolution,
  type CommandResult,
  type CommandRunner,
  detectTailscaleBinary,
  ExecFileRunner,
  resolveTailscaleBinary,
  TAILSCALE_FALLBACK_PATHS,
  TailscaleError,
} from "./runner.js";
export {
  type BackendState,
  type PeerStatus,
  type Profile,
  parseProfiles,
  type TailscaleStatus,
} from "./status.js";
