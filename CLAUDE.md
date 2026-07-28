# sd-tailscale — agent guide

A Stream Deck plugin that controls **Tailscale** on the machine running Stream
Deck. Published at **github.com/sigma/sd-tailscale**. Stack: Nix/direnv/just/
pnpm/biome/rollup/vitest.

## The pipeline

```
Stream Deck app ──▶ @sd-tailscale/plugin ──▶ @sd-tailscale/core ──execFile──▶ `tailscale` CLI ──▶ tailscaled
   (runs plugin)      (Elgato SDK, rollup)     (typed client)                  (local daemon)
                              ▲ LED state ◀── StatusMonitor polls `tailscale status --json` ──┘
```

Tailscale exposes a **local daemon with a CLI**, so the plugin talks to it
**directly** — no browser extension, wire protocol, or bridge.

## Packages (`packages/*`)

- **`@sd-tailscale/core`** — the one module that knows Tailscale's command
  surface. `TailscaleClient` turns each operation (`status`, `up`/`down`,
  `setExitNode`, `ip`, `listProfiles`, `switchProfile`) into one subcommand run
  through an injected `CommandRunner`. The default `ExecFileRunner` execs the
  real binary (no shell); tests inject a fake and never spawn a process. No
  Stream Deck dependency — keep it that way.
- **`@sd-tailscale/plugin`** — the Stream Deck plugin (`@elgato/streamdeck`,
  rollup). Actions are defined once in `src/actions/index.ts`; `StatusMonitor`
  polls the daemon and repaints LEDs. The manifest is a hand-maintained
  `dev.yrh.tailscale.sdPlugin/manifest.json` (UUID namespace `dev.yrh.tailscale`).

## v1 actions

- **Connect** (`connect`) — toggle `tailscale up`/`down`. Its Property Inspector
  lists login profiles (`tailscale switch --list`) so a press can switch account
  before bringing the tailnet up.
- **Exit Node** (`exit-node`) — toggle routing through a configured exit node
  (`tailscale set --exit-node=…`).
- **Copy IP** (`copy-ip`) — copy this device's Tailscale IPv4 to the clipboard.

## Conventions

- **Version control is [jj](https://github.com/jj-vcs/jj)** (colocated with git;
  remote `origin`, bookmark `main`). Use jj, not raw git. Anchor to the repo root
  with `jj root`. Work in granular changes.
- **Commands are not on the bare PATH** — everything runs inside the Nix devShell.
  `direnv allow` once, or prefix: `nix develop 'path:.' --command <cmd>`.
- **`just` is the task runner** (`just` alone lists recipes). Gate before
  committing: `just build && just test && just check` (and `just validate` for
  manifest changes). Formatting/lint is **biome** (2-space, double quotes,
  semicolons).
- Tests are **vitest**. The core client is tested via a fake `CommandRunner`.

## Load-bearing gotchas

- **The Stream Deck *app* runs the plugin, not a terminal.** `just dev-plugin` is
  only a rebuild+restart watcher. Manifest changes (action set, UUID,
  `DisableAutomaticStates`) need a **re-link** (`just link`) + restart, not just a
  rebuild.
- **Toggle LEDs use `DisableAutomaticStates`.** The SDK blind-cycles a
  multi-state action's LED on press; without this the LED can settle wrong. Real
  daemon state drives it via `StatusMonitor` only.
- **The `tailscale` binary must be reachable.** The default runner execs
  `tailscale` on PATH. On macOS the standalone/App Store app ships the CLI inside
  its bundle and may not be on PATH — that's the likeliest "nothing happens".
  `ExecFileRunner` takes an explicit binary path for this case.
- **`tailscale switch --list` is tabular, not JSON.** `parseProfiles` splits it
  on whitespace columns; if a future CLI adds a `--json` form, prefer it.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues via the `gh` CLI. External PRs are **not** a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
