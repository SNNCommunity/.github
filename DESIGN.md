# SNNCommunity visual identity (draft)

> This guide accompanies the unmerged visual redesign proposal. It is not an official design standard until the PR is reviewed and merged.

## Design thesis

**Show the science, not a generic AI icon.** The visual language emphasizes discrete spike events, neuron membrane dynamics, and temporally structured activity. Avoid brain silhouettes, stock robot imagery, floating neural-network graphs, exaggerated benchmark numbers, and institutional emblems.

## Palette

| Token | Dark | Light | Usage |
| --- | --- | --- | --- |
| Background | `#0B1520` | `#F5FAFB` | Hero surfaces |
| Panel | `#122433` | `#E6F3F4` | Subtle separation |
| Primary type | `#F4FAFC` | `#173345` | Heading |
| Secondary type | `#B8CFDB` | `#3C6675` | Explanatory text |
| Spike event | `#55DFC4` | `#087B72` | Scientific accent |
| Membrane trace | `#FFBF77` | `#BA6B27` | Secondary accent |

Use strong contrast on actual GitHub backgrounds. Do not depend on color alone to encode information.

## Assets

- `assets/hero-dark.svg` — 1200×300 dark-mode header.
- `assets/hero-light.svg` — 1200×300 light-mode header.
- `assets/logo-mark.svg` — square icon for export to a PNG or other image upload format.

All source assets are editable SVG files without scripts, external images, remote fonts, or animations. The raster portion represents **discrete events**, not a continuous ECG. The lower curve is a **stylized** illustration of membrane evolution, **not experimental data**.

## Layout rules

1. **Hero** identifies the community in under one screen; don't fill the whole screen with art.
2. **Primary action paths** must link to currently working resources.
3. **Research areas** belong in short supporting statements; large taxonomy tables belong in documentation.
4. **Project status** must be explicit. Planned initiatives should never appear as released software.
5. **Governance, security, and policies** are linked in a quiet footer, never used as the primary introduction.
6. **No fabricated statistics or affiliations.** Use only verifiable indicators.
7. **No unsupported HTML/CSS/JS** in organization README; GitHub Markdown behavior is authoritative.

## Accessibility and responsive checks

- Review GitHub Overview in both light and dark themes at normal desktop and narrow viewport sizes.
- Review the two banners and logo in their expected sizes; the avatar must be recognizable at 32–48 px.
- Confirm alt text communicates the words *SNN Community* and the scientific meaning of the graphic.
- Ensure important meaning is in HTML/Markdown text, not only embedded in an image.
- Confirm relative image paths from `profile/README.md` resolve in the **organization Overview**, not merely in the source file preview.
- Do not auto-merge this draft until checks pass.

## Longer-term site

The GitHub profile is a **gateway**, not the whole community website. When real resources exist, a distinct `SNNCommunity.github.io` GitHub Pages repository can host search, structured learning paths, research-topic navigation and updates. Do not publish an empty portal that looks larger than the actual project.

[Preview changes](https://github.com/SNNCommunity/.github/pull/5)
