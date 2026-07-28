{
  description = "sd-tailscale monorepo dev environment (firefly-engineering/toolbox)";

  inputs = {
    nix-pins.url = "github:firefly-engineering/nix-pins";
    nixpkgs.follows = "nix-pins/nixpkgs";
    toolbox.url = "github:firefly-engineering/toolbox";
    toolbox.inputs.nix-pins.follows = "nix-pins";
  };

  outputs =
    { nixpkgs, toolbox, ... }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forAllSystems =
        f:
        builtins.listToAttrs (
          map (system: {
            name = system;
            value = f system;
          }) systems
        );
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          reg = toolbox.registry.${system};

          # Resolve a toolbox package at its default version.
          tool = name: reg.${name}.versions.${reg.${name}.default};
        in
        {
          # typescript-toolchain bundles nodejs, pnpm, typescript, biome and bun
          # (all pinned) — the JS/TS driver for this monorepo. The @elgato/cli
          # `streamdeck` binary and other JS deps come from pnpm, not nix. The
          # `tailscale` CLI the plugin shells out to is expected on the host, not
          # provided by this shell.
          default = pkgs.mkShell {
            packages = [
              (tool "typescript-toolchain")
              (tool "just")
            ];
          };
        }
      );
    };
}
