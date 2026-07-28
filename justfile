# sd-tailscale monorepo task runner.
# Run `just` with no arguments to list all recipes.
# Everything here wraps the pnpm / streamdeck invocations so you don't have to
# remember them. Assumes you're in the nix devShell (direnv `use flake`).

uuid := "dev.yrh.tailscale"
plugin_log := "packages/plugin/dev.yrh.tailscale.sdPlugin/logs/dev.yrh.tailscale.0.log"

# List available recipes
default:
    @just --list

# Install all workspace dependencies
install:
    pnpm install

# Build every package (core → plugin, in dependency order)
build:
    pnpm -r build

# Remove build outputs
clean:
    rm -rf packages/*/dist packages/plugin/*.sdPlugin/bin

# --- Plugin ------------------------------------------------------------------

# Watch + hot-reload the Stream Deck plugin (rebuild + restart on save)
dev-plugin:
    pnpm -F @sd-tailscale/plugin dev

# Link the plugin into Stream Deck (one-time setup)
# `run` is required: bare `pnpm -F <pkg> link` hits pnpm's built-in `link`
# command instead of the package's `link` script.
link:
    pnpm -F @sd-tailscale/plugin run link

# Validate the plugin manifest + bundle
validate:
    pnpm -F @sd-tailscale/plugin validate

# Restart the plugin in Stream Deck
restart:
    pnpm -F @sd-tailscale/plugin exec streamdeck restart {{uuid}}

# Tail the plugin log (survives reloads — uses tail -F)
logs:
    tail -F {{plugin_log}}

# --- Quality -----------------------------------------------------------------

# Run all unit tests (vitest)
test:
    pnpm -r test

# Format all sources with biome
fmt:
    biome format --write .

# Lint all sources with biome
check:
    biome check .
