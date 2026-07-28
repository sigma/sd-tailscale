# Stream Deck Plugin Icon Design Guidelines & Requirements

> Research for #5 / map #1
> Date: 2026-07-28
> Sources: Elgato primary docs only (docs.elgato.com — SDK manifest reference, plugin guidelines, style guide, marketplace product guidelines). Every claim is cited inline. Facts that could not be confirmed from a primary source are called out explicitly.

---

## 1. Size / format matrix

The authoritative source for the in-plugin asset matrix is the **Manifest reference**
([docs.elgato.com/streamdeck/sdk/references/manifest](https://docs.elgato.com/streamdeck/sdk/references/manifest/)),
corroborated by the **Plugin Guidelines** and **Style Guide**. A crucial distinction Elgato
draws: the **action *key* image** (what renders on the physical key, `Image` / `States[].Image`,
72×72) is a **different asset** from the **action *list* icon** (`Actions[].Icon`, 20×20 — the
small glyph shown in the Stream Deck app's action list).

| Asset | Manifest field | Base size | @2x / high-DPI size | Format | Color requirement |
|---|---|---|---|---|---|
| **Action key icon** (on the physical key) | `States[].Image` (and `Actions[].Icon` fallback via state) | **72 × 72 px** | **144 × 144 px (@2x)** | GIF, PNG, or SVG | none stated (color allowed) |
| **Action list icon** (glyph in the app's action list) | `Actions[].Icon` | **20 × 20 px** | **40 × 40 px (@2x)** | PNG or SVG | **Monochromatic, `#FFFFFF` foreground, transparent background** |
| **Plugin category icon** | `Actions[].Category` group / `CategoryIcon` | **28 × 28 px** | **56 × 56 px (@2x)** | PNG or SVG | **Monochromatic, `#FFFFFF` foreground, transparent background** |
| **Plugin icon** (Stream Deck preferences pane) | `Icon` | **256 × 256 px** | **512 × 512 px (@2x)** | PNG only | none stated (color allowed) |

Source for the whole table: the Manifest reference lists, verbatim:
- **State Image** — "72 × 72 px and 144 × 144 px (@2x)", "GIF, PNG or SVG format", extension-less path, "Can be overridden by the user in the Stream Deck application."
- **Action Icon** — "20 × 20 px and 40 × 40 px (@2x)", "PNG or SVG format", "Monochromatic, with foreground color of #FFFFFF and a transparent background."
- **CategoryIcon** — "28 × 28 px and 56 × 56 px (@2x)", "PNG or SVG format", "Monochromatic, with foreground color of #FFFFFF and a transparent background."
- **Plugin Icon** — "256 × 256 px and 512 × 512 px (@2x)", "PNG only."

([docs.elgato.com/streamdeck/sdk/references/manifest](https://docs.elgato.com/streamdeck/sdk/references/manifest/);
sizes also confirmed in [Plugin Guidelines / Images & Layouts](https://docs.elgato.com/guidelines/streamdeck/plugins/images-and-layouts/))

### `@2x` naming convention and extension-less references

- All manifest image/icon fields use an **extension-less path**. You point the manifest at
  `assets/counter-key` (no `.png`), and Stream Deck resolves the concrete file. The manifest
  reference gives examples like `assets/counter-key`, `assets/icons/mute` for state images and
  `assets/counter`, `imgs/actions/mute` for action icons.
  ([Manifest reference](https://docs.elgato.com/streamdeck/sdk/references/manifest/))
- The high-DPI variant is the **same base name with an `@2x` suffix** before the extension —
  e.g. `assets/counter-key.png` + `assets/counter-key@2x.png`. The manifest labels the larger
  size "(@2x)" for every rasterized asset. Stream Deck automatically selects the `@2x` file on
  high-resolution displays.
  ([Manifest reference](https://docs.elgato.com/streamdeck/sdk/references/manifest/))
- **SVG needs no `@2x`.** Because vector art scales cleanly, the second size only matters "when
  using rasterized images" (PNG). The Plugin Guidelines phrase the second column as e.g.
  "56 × 56 px (high DPI) **when using rasterized images**."
  ([Plugin Guidelines / Images & Layouts](https://docs.elgato.com/guidelines/streamdeck/plugins/images-and-layouts/))

### Marketplace / store assets (publishing)

These are **listing** assets, entirely separate from the in-plugin assets above. They are owned
by the **Marketplace Product Guidelines** ([docs.elgato.com/guidelines/products](https://docs.elgato.com/guidelines/products/)):

| Listing asset | Size | Format | Notes |
|---|---|---|---|
| **App icon** (Marketplace listing thumbnail icon; shown in Stream Deck Plugins area, search results, product page) | **288 × 288 px** | PNG | Distinct from the in-plugin `Icon` (256/512). |
| **Thumbnail** | **1920 × 960 px** | PNG | Shown throughout Marketplace. |
| **Gallery items** | **1920 × 960 px** (images) | PNG for images; **MP4 1920 × 1080, < 250 MB** for video | Minimum **3** gallery items required, up to **10**. |

([Marketplace Product Guidelines](https://docs.elgato.com/guidelines/products/))

Distribution to the Marketplace explicitly requires following these submission guidelines before
submitting a plugin
([Distribution](https://docs.elgato.com/streamdeck/sdk/introduction/distribution/)).

> **Not conflated:** Elgato also publishes **Icon Pack** specs (all images 144×144, SVG/PNG/JPEG/GIF/WEBP,
> filenames ≤80 chars) at [docs.elgato.com/sdk/icon-packs/icon-specs](https://docs.elgato.com/sdk/icon-packs/icon-specs).
> Those govern **downloadable icon packs**, a different product from plugin action icons — do not apply
> the 144×144 icon-pack rule to plugin key images.

---

## 2. Transparency, safe-area, and padding

- **Transparency:** Action list icons and category icons **must have a transparent background**
  ("Monochromatic, with foreground color of #FFFFFF and a transparent background").
  ([Manifest reference](https://docs.elgato.com/streamdeck/sdk/references/manifest/);
  [Plugin Guidelines / Images & Layouts](https://docs.elgato.com/guidelines/streamdeck/plugins/images-and-layouts/))
  The Style Guide restates this: "Action and Category images should be a single color rgb(255,255,255)
  (#FFFFFF) with a transparent background."
  ([Style Guide](https://docs.elgato.com/sdk/plugins/style-guide))
- **Key (state) image background:** primary docs do **not** mandate transparency for the 72×72 key
  image; color and full-bleed art are permitted (the key image is the full button face).
  ([Manifest reference](https://docs.elgato.com/streamdeck/sdk/references/manifest/))
- **Plugin icon background:** no transparency requirement stated; it just must "accurately portray
  what your plugin does."
  ([Plugin Guidelines / Images & Layouts](https://docs.elgato.com/guidelines/streamdeck/plugins/images-and-layouts/))

> **NOT VERIFIED from a primary source:** an explicit numeric **safe-area / padding** figure inside
> the 72×72 key, and any **corner-treatment / rounded-corner** rule. None of the Elgato primary pages
> reviewed (manifest reference, plugin guidelines, style guide, product guidelines) specify a padding
> percentage or corner radius for key art. Treat "keep art away from the edges" as convention, not a
> documented spec.

---

## 3. Multi-state actions (per-state images)

- An action declares a **`States` array** in the manifest; **two states** turn the action into a
  **toggle** (e.g. on/off, mute/unmute). "When two states are defined the action will act as a toggle,
  with users being able to select their preferred iconography for each state."
  ([Style Guide](https://docs.elgato.com/sdk/plugins/style-guide))
- Each entry in `States[]` supplies its **own `Image`** (72×72 / 144×144), so each state renders a
  distinct key icon. Extension-less path per state.
  ([Manifest reference](https://docs.elgato.com/streamdeck/sdk/references/manifest/))
- Elgato's **best-practice guidance**: "Actions should use state to toggle a status rather than provide
  separate actions e.g. a single On/Off action, rather than separate On and Off actions."
  ([Style Guide](https://docs.elgato.com/sdk/plugins/style-guide))
- **Runtime behavior (Keys guide):** actions support "up to two states"; on press "the state is toggled …
  with the new state index available via the payload." You can **opt out of automatic toggling** in the
  manifest (relevant to this repo's `DisableAutomaticStates`). Assign a **`Name` to each state** so users
  can pick a target state in multi-actions. `setImage()` can target a specific state
  (`state: 1`) and target (`Target.HardwareAndSoftware`).
  ([Keys guide](https://docs.elgato.com/streamdeck/sdk/guides/keys/))
- **Runtime image formats** (via `setImage`): SVG (recommended), JPG/JPEG, PNG, WEBP. **Animated GIF is
  NOT supported by `setImage`** (though GIF is allowed as a static manifest state image). Programmatic
  key updates are capped at ~**10 per second**.
  ([Keys guide](https://docs.elgato.com/streamdeck/sdk/guides/keys/);
  [Plugin Guidelines / Images & Layouts](https://docs.elgato.com/guidelines/streamdeck/plugins/images-and-layouts/))
- **Rendering precedence** (highest to lowest): (1) user-defined title/image, (2) runtime `setTitle`/
  `setImage`, (3) manifest defaults.
  ([Keys guide](https://docs.elgato.com/streamdeck/sdk/guides/keys/))

---

## 4. Monochrome / contrast conventions

- **Monochrome is REQUIRED** for the **action list icon** and **category icon**: single color
  `#FFFFFF` / `rgb(255,255,255)` on a transparent background. Stream Deck **auto-adjusts** these
  monochromatic white-stroke icons. Color and solid backgrounds are **not allowed** for these list/
  category icons.
  ([Manifest reference](https://docs.elgato.com/streamdeck/sdk/references/manifest/);
  [Plugin Guidelines / Images & Layouts](https://docs.elgato.com/guidelines/streamdeck/plugins/images-and-layouts/);
  [Style Guide](https://docs.elgato.com/sdk/plugins/style-guide))
- **Key images and the plugin icon are NOT restricted to monochrome** — color is expected/allowed
  there (the key image is the full button face; the plugin icon should portray the product).
  ([Manifest reference](https://docs.elgato.com/streamdeck/sdk/references/manifest/))
- **Format preference for legibility/scaling:** **SVG is recommended** for icons/keys because it
  "scales well on all devices and layouts," whereas rasterized PNG "may not scale well." Provide both
  a high-res and low-res version for any rasterized asset.
  ([Style Guide](https://docs.elgato.com/sdk/plugins/style-guide);
  [Plugin Guidelines / Images & Layouts](https://docs.elgato.com/guidelines/streamdeck/plugins/images-and-layouts/))

> **NOT VERIFIED from a primary source:** a specific numeric **contrast ratio** or explicit
> "legibility on a backlit key" guidance. Elgato's primary docs push monochrome-white + SVG + auto-adjust
> for list/category icons, but do not publish a contrast-ratio target for key art.

---

## Key numbers at a glance

- Key (state) image: **72×72** → **144×144 @2x** — GIF/PNG/SVG.
- Action list icon: **20×20** → **40×40 @2x** — PNG/SVG, mono white #FFFFFF, transparent.
- Category icon: **28×28** → **56×56 @2x** — PNG/SVG, mono white #FFFFFF, transparent.
- Plugin icon: **256×256** → **512×512 @2x** — PNG only.
- Marketplace app icon: **288×288** PNG; thumbnail & gallery: **1920×960** PNG (video 1920×1080 MP4).
- All manifest paths are **extension-less**; `@2x` suffix is only needed for rasterized (PNG) assets, not SVG.

## Facts NOT confirmable from primary sources

1. Numeric safe-area / padding inside the 72×72 key.
2. Corner treatment / rounded-corner radius for key art.
3. A specific contrast ratio or explicit backlit-key legibility spec.

(All three are absent from the manifest reference, plugin guidelines, style guide, and product
guidelines. Reported as unverified rather than guessed.)

> Sourcing note: the SDK Manifest reference and the Marketplace Product Guidelines pages loaded in
> full. The Plugin Guidelines (Images & Layouts), Style Guide, and Keys guide figures were captured
> from Elgato's own documentation via search extraction; where a page could not be loaded in full the
> figures below are cross-checked against the manifest reference, which agrees on every overlapping number.

---

## Sources

- Manifest reference (SDK): https://docs.elgato.com/streamdeck/sdk/references/manifest/
- Plugin Guidelines — Images and Layouts (Marketplace): https://docs.elgato.com/guidelines/streamdeck/plugins/images-and-layouts/
- Plugin Guidelines (Marketplace, index): https://docs.elgato.com/guidelines/stream-deck/plugins/
- Style Guide (SDK): https://docs.elgato.com/sdk/plugins/style-guide
- Keys guide (SDK): https://docs.elgato.com/streamdeck/sdk/guides/keys/
- Distribution (SDK): https://docs.elgato.com/streamdeck/sdk/introduction/distribution/
- Marketplace Product Guidelines: https://docs.elgato.com/guidelines/products/
- Plugin Metadata Guidelines (Marketplace): https://docs.elgato.com/guidelines/streamdeck/plugins/metadata/
- Icon Pack specs (for contrast, NOT plugin icons): https://docs.elgato.com/sdk/icon-packs/icon-specs
