# sd-tailscale

A [Stream Deck](https://www.elgato.com/stream-deck) plugin to control
[Tailscale](https://tailscale.com) on the machine running Stream Deck —
connect/disconnect (with account switching), toggle an exit node, and copy your
device's Tailscale IP.

## How it works

The plugin shells out to the local `tailscale` CLI — no browser extension or
bridge. State for the LEDs comes from polling `tailscale status --json`.

```
Stream Deck app → @sd-tailscale/plugin → @sd-tailscale/core → `tailscale` CLI → tailscaled
```

## Packages

| Package | What |
| --- | --- |
| `@sd-tailscale/core` | Typed client over the `tailscale` CLI (testable via an injected command runner) |
| `@sd-tailscale/plugin` | The Stream Deck plugin (Elgato SDK + rollup) |

## Development

Everything runs inside the Nix devShell (`direnv allow`, or
`nix develop`). `just` lists the tasks:

```sh
just install     # pnpm install
just build       # build core, then bundle the plugin
just test        # vitest
just link        # link the plugin into Stream Deck (one-time)
just dev-plugin  # watch + hot-reload
just validate    # validate the manifest + bundle
```

## Requirements

- The `tailscale` CLI must be reachable on the host running Stream Deck.
- macOS 10.15+ or Windows 10+, Stream Deck 6.5+.

## License

[MIT](LICENSE) © Yann Hodique

## Status

Early scaffold. The action icons under
`packages/plugin/dev.yrh.tailscale.sdPlugin/imgs/` are solid-color placeholders
to be replaced with real art.
