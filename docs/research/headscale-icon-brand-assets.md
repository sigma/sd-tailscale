# headscale icon & brand assets — sourcing brief

**Ticket question:** Could we reuse **headscale**'s icons/brand for the plugin's action
glyphs instead of Tailscale-aligned artwork? headscale (`juanfont/headscale`) is an
open-source, self-hostable reimplementation of the Tailscale control server, driven by
the same Tailscale clients.

**Status:** Research complete. Primary sources only (headscale repo, headscale.net,
LICENSE). Date: 2026-07-28.

---

## Verdict / Recommendation

**Do not source the plugin's icons from headscale. Keep the original,
Tailscale-palette-aligned glyphs.**

Three independent reasons, each grounded below:

1. **There is no usable asset.** headscale ships exactly **one** brand identity — an
   abstract "dots" mark plus a stacked wordmark lockup (the "headscale3" logo), in
   SVG/PNG/PDF. There is **no icon set** for UI, and — contrary to the ticket's premise
   — **no cartoon mascot**. There is nothing here you could build three action glyphs
   (Connect / Exit Node / Copy IP) from.
2. **Licensing/trademark is silent, and BSD-3's clause 3 actively cuts against
   endorsement branding.** The code is BSD-3-Clause (© 2020 Juan Font). BSD-3 grants
   **no trademark rights** and does not cover the logo-as-artwork; there is **no
   TRADEMARK file, no brand guidelines, no logo-usage grant** anywhere in the repo or on
   the site — pure silence. BSD-3 clause 3 additionally forbids using "the name of the
   copyright holder … to endorse or promote products derived from this software without
   specific prior written permission." Shipping headscale's mark in an unaffiliated
   plugin is exactly the endorsement-suggesting use that silence + clause 3 counsel
   against.
3. **It's an identity mismatch.** The plugin drives the `tailscale` **client CLI**, which
   most users point at **Tailscale's own SaaS coordination server**, not headscale.
   Branding the plugin with headscale would mislabel the tool for the majority of its
   users. headscale is a *backend the same client can talk to*, not the thing the plugin
   controls.

This mirrors the parallel Tailscale-brand conclusion (see
`tailscale-brand-assets.md`): prefer an **original** icon on a recognizable palette over
shipping someone else's trademarked mark under license silence. The both-worlds option,
if control-server neutrality is ever wanted, is an **original, control-server-agnostic
glyph** (e.g. the plugin's own mark on Tailscale-family colors) — not headscale's logo.

---

## 1. Assets headscale publishes

- **What exists:** a single brand identity, versioned "headscale3", living in the repo at
  **`docs/assets/logo/`**. Six files — two designs × three formats:
  - `headscale3-dots.{svg,png,pdf}` — the standalone **icon/dots mark**.
  - `headscale3_header_stacked_left.{svg,png,pdf}` — the **wordmark lockup** (mark + the
    word "headscale"), which is the logo shown at the top of the README.
  - Source: repo tree [`docs/assets/logo`](https://github.com/juanfont/headscale/tree/main/docs/assets/logo);
    README references [`docs/assets/logo/headscale3_header_stacked_left.png`](https://raw.githubusercontent.com/juanfont/headscale/main/README.md).
- **What the mark looks like:** the `headscale3-dots.svg` is an **abstract geometric
  mark** — a small cluster of gray dots/circles with one **pink** accent dot
  (`#f8b5cb`) and dark elements (`#303030`); no character or face. Notably it reads as a
  *dot-grid* motif, visually adjacent to Tailscale's own nine-dot logo family, which
  makes it a poor "distinct alternative" and a trademark-proximity hazard on both sides.
  Source: raw SVG
  [`headscale3-dots.svg`](https://raw.githubusercontent.com/juanfont/headscale/main/docs/assets/logo/headscale3-dots.svg).
- **No icon set.** There are no per-feature glyphs, no state icons, no monochrome UI
  variants — just the one logo in two lockups. Nothing scoped for Stream Deck's
  72×72/144×144 action tiles.
- **No mascot.** The ticket assumed "headscale has a known cartoon mascot." **Not
  verified from any primary source.** The current and historical branding is the
  abstract dots/wordmark: even the older README at tag **v0.22.3** already referenced the
  same `headscale3_header_stacked_left` wordmark (path `docs/logo/…` before the Nov-2025
  move to `docs/assets/logo/`), with no mascot. Sources:
  [v0.22.3 README](https://raw.githubusercontent.com/juanfont/headscale/v0.22.3/README.md),
  logo-dir move commit visible in
  [logo history](https://github.com/juanfont/headscale/commits/main/docs/assets/logo).
  I also checked the frequently-cited FOSS mascot designer **Tyson Tan** (Krita's Kiki,
  KDE's Konqi): headscale is **not** among his projects
  ([tysontan.com/free-software-top](https://tysontan.com/free-software-top/)). The
  "mascot" premise appears to be a misconception.
- **Docs site / brand kit:** the official docs site is **headscale.net** (redirects to
  `/stable/`). It reuses the same logo; it publishes **no brand kit, no press page, and no
  logo-usage guidelines**. The FAQ carries no trademark or branding terms. Sources:
  [headscale.net](https://headscale.net/),
  [FAQ](https://headscale.net/stable/about/faq/). (Third-party icon aggregators like
  dashboardicons.com re-host the same logo — not a primary/authorized source.)

## 2. Licensing & trademark

- **Code license:** **BSD 3-Clause "New" License**, header "BSD 3-Clause License",
  copyright **"Copyright (c) 2020, Juan Font."** Source:
  [LICENSE](https://github.com/juanfont/headscale/blob/main/LICENSE).
- **No trademark grant.** BSD-3 is a permissive *code* license. Like MIT/Apache-2's
  permissive peers (and unlike Apache-2, it doesn't even have a patent grant), it conveys
  **no trademark license** and does not purport to license the **logo as a copyrighted
  artwork**. A logo/mark is separate IP from the source it ships alongside.
- **Clause 3 (endorsement) actively cuts against branding a third-party product with the
  headscale name/mark**, verbatim: *"Neither the name of the copyright holder nor the
  names of its contributors may be used to endorse or promote products derived from this
  software without specific prior written permission."* Source:
  [LICENSE](https://raw.githubusercontent.com/juanfont/headscale/main/LICENSE).
- **Explicit permission? No. Explicit restriction of the *logo*? No. → Silence.** There
  is **no `TRADEMARK`/`BRAND` file**, no logo-usage policy, and no press/brand page in the
  repo or on headscale.net. Third-party use of the mark inside an unaffiliated Stream
  Deck plugin is therefore **neither granted nor addressed** — the same "terms largely
  silent, safest avoided" posture the Tailscale-mark research reached for Tailscale's
  nine-dot glyph.
- **headscale's own non-affiliation disclaimer** (relevant precedent for how *they* frame
  brand proximity): README/FAQ state **"This project is not associated with Tailscale
  Inc."** (noting one active maintainer is *employed* by Tailscale and contributes with
  review). If headscale itself foregrounds a non-affiliation disclaimer toward Tailscale,
  an unaffiliated plugin wrapping *headscale's* mark without permission is the mirror-image
  risk. Sources:
  [README](https://raw.githubusercontent.com/juanfont/headscale/main/README.md),
  [FAQ](https://headscale.net/stable/about/faq/).

## 3. Fit / recommendation

- **The plugin's job is Tailscale-client-shaped, not headscale-shaped.** It shells out to
  the local `tailscale` CLI (`up`/`down`, `set --exit-node`, `ip`, `switch`). That client
  is identical whether it points at Tailscale SaaS **or** a self-hosted headscale — the
  *coordination server* is an invisible backend detail. headscale is one possible backend
  among (predominantly) Tailscale's own. Source: headscale positions itself as "a
  self-hosted, open source alternative to the Tailscale control server"
  ([FAQ](https://headscale.net/stable/about/faq/)).
- **Identity conflict:** branding action tiles with the headscale logo would tell the
  average user the plugin is a headscale tool, when most installs talk to Tailscale's
  SaaS. It advertises the wrong (and minority) backend and imports headscale's own
  Tailscale-non-affiliation baggage.
- **Both-worlds option (if backend-neutrality is ever a goal):** ship an **original,
  server-agnostic glyph** — the plugin's own mark on a Tailscale-family palette — that
  reads correctly regardless of backend. That is strictly better than either party's
  trademarked dot-grid, and it sidesteps the near-identical nine-dot motifs both
  headscale and Tailscale use.
- **Decision:** **Keep the original Tailscale-aligned glyphs.** Do **not** source or blend
  in headscale's mark: there's no reusable asset, no license/permission for the logo, an
  endorsement clause pointing the other way, and an audience mismatch.

---

## Source index (primary)

- Repo & README (logo ref, Tailscale disclaimer):
  <https://github.com/juanfont/headscale> ·
  <https://raw.githubusercontent.com/juanfont/headscale/main/README.md>
- Logo assets dir: <https://github.com/juanfont/headscale/tree/main/docs/assets/logo>
- Dots mark SVG (visual/colors):
  <https://raw.githubusercontent.com/juanfont/headscale/main/docs/assets/logo/headscale3-dots.svg>
- LICENSE (BSD-3-Clause, © 2020 Juan Font, clause 3):
  <https://github.com/juanfont/headscale/blob/main/LICENSE> ·
  <https://raw.githubusercontent.com/juanfont/headscale/main/LICENSE>
- Docs site & FAQ (no brand kit / disclaimer): <https://headscale.net/> ·
  <https://headscale.net/stable/about/faq/>
- Historical branding check (v0.22.3):
  <https://raw.githubusercontent.com/juanfont/headscale/v0.22.3/README.md>
- Mascot-designer negative check (Tyson Tan FOSS list):
  <https://tysontan.com/free-software-top/>
