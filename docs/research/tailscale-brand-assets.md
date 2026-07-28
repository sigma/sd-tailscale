# Tailscale Brand Assets & Third-Party Usage Terms

**Research date:** 2026-07-28
**Scope:** Whether an *unofficial community* Stream Deck plugin (`@sd-tailscale/plugin`) may use the Tailscale **name** and **mark/logo** in its name and action icons.
**Source discipline:** Only first-party Tailscale sources are cited below (tailscale.com, its Sanity CDN media kit, the official `Tailscale_BrandToolkit` PDF shipped in that kit, and the tailscale/tailscale GitHub repo). Third-party logo aggregators (Brandfetch, seeklogo, etc.) were deliberately excluded.

---

## Executive verdict

**Using the Tailscale *name/wordmark*: YES, with conditions.** Tailscale's only published statement on third-party mark usage — in its Community Projects docs — permits describing your project with the Tailscale mark **provided you do not do so in a way that could confuse users or suggest an official affiliation or partnership** ([tailscale.com/community/community-projects](https://tailscale.com/community/community-projects), [docs/reference/tailscale-community-projects](https://tailscale.com/docs/reference/tailscale-community-projects)). This is classic nominative/referential use: naming the plugin descriptively (e.g. "an unofficial Stream Deck plugin for Tailscale") with a clear non-affiliation disclaimer is squarely within what they describe.

**Using the Tailscale *mark/logo* (the nine-dot icon) inside action icons: WITH CONDITIONS — and Tailscale's terms are largely SILENT/ambiguous on this specific case.** Tailscale publishes an official Brand Toolkit and downloadable logo assets, but that toolkit is a *design* guide, not a *legal license*, and it is written for Tailscale's own/authorized use. Tailscale is BSD-3-Clause open source, and that license grants **no trademark rights** ([GitHub LICENSE](https://github.com/tailscale/tailscale/blob/main/LICENSE)). Tailscale has **not published a standalone trademark/logo-usage policy** for third parties, and explicitly notes it "plan[s] to share additional mark usage best practices guidance in the future" ([community-projects](https://tailscale.com/community/community-projects)) — i.e. it is currently unwritten. Using the actual Tailscale logo as your app/action icon is the *highest-confusion* form of mark use (it most strongly implies "official"), so it carries the most risk and is **not clearly permitted**. Safer path: use the name descriptively, add a non-affiliation disclaimer, and prefer an original/generic icon rather than reproducing Tailscale's mark; if the mark is used, follow the Brand Toolkit rules exactly and do not modify it. When in doubt, email community@tailscale.com / press@tailscale.com for permission.

---

## 1. Official brand assets

**Primary source:** Tailscale press page — [https://tailscale.com/press](https://tailscale.com/press) — offers a "Brand Assets" media-kit download and lists the contact `press@tailscale.com`. The page footer carries the ownership notice: *"Tailscale is a registered trademark of Tailscale Inc. | WireGuard is a registered trademark of Jason A. Donenfeld."* ([tailscale.com/press](https://tailscale.com/press))

**Media-kit download (official CDN):**
`https://cdn.sanity.io/files/w77i7m8x/production/a426ba5f63316745e108a18a6dbbfed6970752fd.zip?dl=` (linked from tailscale.com/press; ~13 MB ZIP). Verified downloaded and unpacked on 2026-07-28.

**Contents of the official media kit** (verified by unpacking the ZIP):

- `Tailscale_BrandToolkit_10-2025.pdf` — the official Brand Toolkit (cover reads "April 2025").
- `Tailscale Logo/` with three lockups × two color variants × four file formats:
  - **Lockups / marks:**
    - `Tailscale_logo_*` — the **full logo** (nine-dot icon + "tailscale" wordmark).
    - `Tailscale_icon_*` — the **nine-dot icon** alone (the primary mark/symbol).
    - `Tailscale_squircle_*` — the icon inside a rounded-square ("squircle") tile, i.e. the **app-icon / favicon-style** form.
  - **Color variants:** `Blk` (dark/black on light) and `Wht`/reversed (white on dark).
  - **File formats:** **SVG, PNG, JPG, EPS.** (Exact files include `Tailscale_icon_blk_rgb.svg`, `Tailscale_squircle_blk_rgb.svg`, `Tailscale_logo_wht_rgb.svg`, `Tailscale_squircle_reversed.png`, `Tailscale_icon_reversed.png`, EPS equivalents, etc.)
- `Tailscale Screenshots/` — product screenshots (admin console, native apps).

**Logo composition & meaning** (Brand Toolkit p.2): the logo = icon (nine dots) + wordmark ("tailscale"). The nine-dot icon symbolizes meshed devices; the wordmark is set in *Reader Pro* by Colophon.

**Monochrome variants:** Yes — the kit ships black (`Blk`) and white/reversed (`Wht`) versions for light vs dark backgrounds (Brand Toolkit p.3). **However**, the toolkit says the nine gray dots should adapt in opacity and explicitly warns: *"Avoid using the logo in single-color formats (e.g., one-color vinyl)"* and *"never place the logo on complex backgrounds"* (Brand Toolkit p.3). Minimum size is **48×48 px / 0.5×0.5 in / 12.7×12.7 mm** (Brand Toolkit p.4).

**Typography** (context, not usable by third parties without their own licenses): primary typeface **Inter** (regular/medium only; never bold/light); monospaced **MD IO** for code (Brand Toolkit pp.8–9).

---

## 2. Brand color palette (HEX)

All values below are transcribed directly from the official `Tailscale_BrandToolkit_10-2025.pdf` (pp.5–6). The toolkit frames the **monochromatic gray scale as the "core" palette** (elegant/quiet/background), with the colored ranges as **accents** — "**use the 400-range values as your primary accent colors.**"

> Note on the "signature color": secondary sites label `#D04841` as Tailscale's signature red. In the *official* toolkit this is **Red400**, the red *accent* core tone — not the brand's primary color. The toolkit's actual primary/core is the neutral gray scale anchored by **Gray900 `#1F1E1E`** (also given as the dark-background reference). Both facts are represented below.

### Core (monochromatic) palette — the documented "core" (p.5)

| Token | HEX | RGB | Pantone |
|---|---|---|---|
| Gray900 | `#1F1E1E` | 31, 30, 30 | 419 C |
| Gray600 | `#444342` | 68, 67, 66 | Cool Gray 11 C |
| Gray500 | `#706E6D` | 112, 110, 109 | Cool Gray 9 C |
| Gray400 | `#AFACAB` | 175, 172, 171 | Cool Gray 5 C |
| Gray300 | `#DAD6D5` | 218, 214, 213 | Cool Gray 1 C |
| Gray200 | `#EEEBEA` | 238, 235, 234 | 663 C |
| Gray0 | `#FAF9F8` | 250, 249, 248 | 7436 C |

Light-background reference `#FFFFFF`; dark-background reference `#1F1E1E` (p.3).

### Accent palette — 400-range = primary accents (p.6)

| Token | HEX | RGB | Pantone |
|---|---|---|---|
| Blue400 (accent) | `#5A82DE` | 90, 130, 222 | 2718 C |
| Green400 (accent) | `#09825D` | 9, 130, 93 | 3405 C |
| **Red400 (accent — the "signature red")** | `#D04841` | 208, 72, 65 | 7417 C |
| Orange400 (accent) | `#BB5504` | 187, 85, 4 | 159 C |
| Purple400 (accent) | `#995FC3` | 153, 95, 195 | 7442 C |

Full accent ramps are documented in the toolkit (e.g. Red: Red900 `#420000`, Red600 `#940821`, Red500 `#B22D30`, Red400 `#D04841`, Red300 `#E46C63`, Red200 `#F68F87`, Red50 `#FFD3CF`; Blue/Green/Orange/Purple have analogous 900→50 ramps — see PDF p.6). **Color usage rules (p.7):** no more than three colors per layout; do not mix palettes; favor monotone combinations.

---

## 3. Usage / trademark terms

### What official sources exist (and don't)

- **No dedicated third-party trademark policy page.** `tailscale.com/brand` and `tailscale.com/licenses` both return **HTTP 404** (checked 2026-07-28). There is no `trademark`-policy page equivalent to those some companies publish.
- The **only** first-party statement on third-party mark usage is in the **Community Projects** docs.
- The **Brand Toolkit PDF** contains design/craft rules (color, clearspace, min-size, backgrounds) but **no legal grant of rights** and no third-party licensing language. It reads as guidance for Tailscale and its authorized partners.
- Ownership notice (repeated across the site footer / press page): *"Tailscale is a registered trademark of Tailscale Inc."* ([tailscale.com/press](https://tailscale.com/press)).

### The controlling first-party statement (Community Projects)

> "If you use the Tailscale mark when describing your community project, please make sure you don't do so in a way that might confuse users and suggest an official affiliation or partnership."
> — [tailscale.com/community/community-projects](https://tailscale.com/community/community-projects)

The Community Projects docs also state that Community Projects are *"Tailscale-controlled and/or third-party-controlled open source projects built on top of Tailscale networking and identity building blocks,"* require an **OSI-approved open-source license** and a public repo, and are provided "as is" ([docs/reference/tailscale-community-projects](https://tailscale.com/docs/reference/tailscale-community-projects), [special-terms](https://tailscale.com/special-terms)). Submissions go to `community@tailscale.com`. Tailscale notes it *plans to share additional mark-usage best-practice guidance in the future* — confirming the current guidance is intentionally minimal.

Interpreting this for a third party:
- **(a) Name/wordmark** — Permitted to *describe* the project, as long as it doesn't confuse users into thinking it's official/affiliated. (This is referential/nominative use.)
- **(b) Logo/mark** — Not separately addressed. The single sentence speaks to "the Tailscale mark when **describing**" a project; it does not affirmatively grant the right to reproduce the logo as your product's icon. Reproducing the logo is the strongest possible affiliation signal, so it sits closest to the prohibited "suggest an official affiliation" line.
- **(c) Disclaimers / naming** — The no-confusion / no-implied-affiliation requirement is the explicit rule. A visible "unofficial / not affiliated with or endorsed by Tailscale Inc." disclaimer is the concrete way to satisfy it.
- **(d) Explicit position on community integrations/plugins** — Tailscale actively *welcomes* community open-source projects built on Tailscale and curates them, but curation/listing is separate from any trademark license.

### Open-source status & trademark carve-out

- Tailscale's core client (`tailscale/tailscale`) is **open source under the BSD 3-Clause License** ([github.com/tailscale/tailscale/blob/main/LICENSE](https://github.com/tailscale/tailscale/blob/main/LICENSE)).
- **BSD-3-Clause grants copyright rights only; it grants NO trademark rights.** Its third clause bars using "the name of the copyright holder nor the names of its contributors ... to endorse or promote products derived from this software without specific prior written permission." So the code license does **not** authorize use of the Tailscale name or logo for branding/endorsement — trademark permission must come from Tailscale separately (consistent with the general rule that permissive OSS licenses reserve trademarks).

---

## 4. Conditions checklist (for `@sd-tailscale/plugin`)

Use of the **name** (lower risk) — do all of these:

- [ ] Use "Tailscale" **descriptively/referentially** ("a Stream Deck plugin for Tailscale"), not as your own product brand name in a way that reads as first-party. — *required by* [community-projects](https://tailscale.com/community/community-projects)
- [ ] Include a clear **non-affiliation disclaimer**, e.g. "Unofficial. Not affiliated with, endorsed, or sponsored by Tailscale Inc. Tailscale is a registered trademark of Tailscale Inc." — *satisfies the "no confusion / no implied affiliation" rule* + mirrors the official ownership notice on [tailscale.com/press](https://tailscale.com/press)
- [ ] Do **not** imply partnership, endorsement, or that this is an official Tailscale product anywhere in the manifest, listing, or UI.
- [ ] Keep the project **open source under an OSI license** (already the case) — aligns with Community Projects criteria and keeps the door open to being listed.

Use of the **logo/mark in action icons** (higher risk — proceed only with care, ideally after asking):

- [ ] Prefer an **original icon** that evokes function (e.g. a generic network/toggle glyph) rather than reproducing Tailscale's nine-dot mark, to stay clear of "implies official." — *safest given the terms are silent*
- [ ] If the actual mark is used, use the **unmodified** official asset from the media kit (do not recolor, restretch, add effects, or alter proportions). — Brand Toolkit pp.3–4
- [ ] Respect the toolkit's mechanics: min **48×48 px**, adequate contrast, **not** on complex/photographic backgrounds, and avoid one-color/single-color reproductions. — Brand Toolkit pp.3–4 (note: Stream Deck keys are ~72–144 px, so min-size is satisfiable)
- [ ] **UNCONFIRMED whether third-party icon/app-tile use is permitted at all** — Tailscale has published no rule granting or forbidding it. **Recommended: email `community@tailscale.com` (or `press@tailscale.com`) for explicit permission before shipping the mark in icons.**

### Explicitly UNCONFIRMED / ambiguous points

- Whether a third party may use the Tailscale **logo** (vs. the name) as an app/action icon — **no first-party rule exists**; the one statement only covers using the mark to *describe* a project.
- Any **written trademark license, size/placement license, or "acceptable logo use" policy** for third parties — **does not exist publicly** (`/brand` and `/licenses` are 404; the Brand Toolkit is design guidance, not a license).
- Whether listing as an official "Community Project" would confer any additional mark rights — **not stated**; curation and trademark licensing are presented separately.
