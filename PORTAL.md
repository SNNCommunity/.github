# SNN Community portal · Maintainer guide

**Website:** https://snncommunity.github.io/.github/  
**Source:** `main/docs` of `SNNCommunity/.github`  
**Primary branch:** `main` · Static GitHub Pages, no runtime build.

## Directory overview

- `docs/index.html` — semantic layout, scientific explanation, social and search metadata.
- `docs/styles.css` — responsive design tokens, accessibility and scientific figure styling.
- `docs/neuron-core.js` — pure numerical reference used by the browser.
- `docs/app.js` — plot, controls, navigation and resource rendering.
- `docs/resources.json` — canonical machine-readable, provenance-indexed research links.
- `docs/og-card.svg` and `docs/social-card.png` — editable OG artwork and PNG preview.
- `docs/favicon.svg` and `docs/avatar.png` — icon source and 512 px avatar export.
- `docs/404.html`, `docs/.nojekyll` — static Pages maintenance.
- `experiments/lif-reference/run.py` — independent dependency-free numeric reference.
- `tests/*.test.mjs`, `tests/browser-smoke.mjs` — numeric parity, content and browser smoke tests.

## Numerical definition and comparison

All variables are **normalized and dimensionless**, except the time coordinate, which is in milliseconds. Forward Euler step `dt = 1 ms`, duration `200 ms`, initial membrane `V[0]=0`. Each simulation returns 201 state observations and 200 inputs.

LIF:

```text
V_pre[t+1] = V[t] + (I[t] - V[t]) / tau
```

Matched-gain nonleaky IF:

```text
V_pre[t+1] = V[t] + I[t] / tau
```

Both models use **the same input gain** `1/tau`, threshold, input sequence, and hard reset `V[t+1]=0` whenever `V_pre[t+1]>=Vth`. This isolates the leak term as the only model difference, but does **not** imply that `tau` is a membrane decay time constant in nonleaky IF. It serves as a matched integration scale. IF is not a more biologically realistic benchmark.

Input is on for `12 <= t < 188` (step stimulus), or repeats 22 ms ON of each 40 ms interval from t=12 with amplitude `1.75×` under pulse mode, restricted to that same interval.

Charts show a three-panel common time axis: input current, membrane potential (LIF solid and optional IF dashed), and output spike markers. Threshold-crossing peaks correspond to `V_pre`; state traces exported as `V` are after hard reset.

**Outputs:** current setup JSON, URL containing validated model parameters only, PNG of the current plot, and CSV with `time_ms`, previous interval input, LIF/IF pre-reset and post-reset voltages and event markers.

## Reproduction evidence — what has and has not been done

`experiments/lif-reference/run.py` is a separate standard-library Python implementation of the same discrete equations. The Node CI suite checks 5 different configurations × 2 models, comparing every voltage, current and spike time with `1e-12` absolute tolerance. The browser suite runs in headless Chromium on desktop/tablet/mobile sizes, exercises controls, downloadable PNG/CSV, parameter URLs and resource filtering.

**Only mathematical cross-implementation checks are supported by this evidence.** We do not claim biological calibration, independent review, paper reproduction, task accuracy, low-power results, or benchmark outcomes.

Re-run locally:

```bash
python3 experiments/lif-reference/run.py --model LIF --tau 20 --threshold 0.85 --current 1.55
node --test tests/portal.test.mjs tests/neuron-core.test.mjs
```

The browser smoke suite is executed through GitHub Actions with Playwright/Chromium and screenshots attached to the run. It is not a complete WCAG 2.2 audit.

## Typography and resource browse behavior

The publishing design uses a readable 16 px baseline, 14–17 px action text and
scientific descriptions, and 12–13 px metadata. Interactive controls target at
least 44 px vertical touch height; `prefers-reduced-motion` and visible keyboard
focus remain supported. These design targets are not an independent WCAG
certification. Browser checks validate computed font sizes and minimum control
bounds across 1440, 768, 390 and 320 CSS pixel viewports.

The Research Atlas initially renders **six** cards to reduce page length on
small displays. All seven metadata/search dimensions can be intersected, including
multiple topic memberships and evidence-linked author institutions. The “Load more resources” reveals up to 12 additional cards per activation; filtered results use the same incremental disclosure without losing matches. Active-filter chips offer direct removal and multi-topic Any/All search is indexed by human-readable topic labels. Every index entry retains its source provenance
and `indexed_not_reproduced` disclosure. The show-all section is hidden when
unneeded, including its spacing. Original resource URLs remain accessible
without JavaScript.

## Research resource governance

`docs/resources.json` (schema v2) is the canonical source of 22 curated entries (13 papers plus 9 independent resources). It records topics, original URLs, formal year and venue for papers, DOI when confirmed, code and license sources, and cited university/country author affiliations where verified. Entries remain `indexed_not_reproduced`. The pure `docs/atlas-core.js` engine handles deterministic multi-facet filtering. **Country means academic author affiliation, not nationality**; author affiliation is never inferred for software. Null license means **not validated**, not public domain. See [RESEARCH_ATLAS.md](RESEARCH_ATLAS.md) for the taxonomy, venue/year rules and evidence model.

Paper DOIs are sourced from original publisher or authors' publication records. Resource inclusion is **not a claim of affiliation or of independent technical reproduction**.

In future, review submitted resources for persistent identifiers, current original URLs, version/commit, citation, upstream license and whether evidence of reproduction exists. Do not mark `reproduced` without public logs and executable instructions.

## Search, sharing and previews

The home page provides `Organization` structured data, canonical URL, Open Graph 1200×630 **PNG** and large Twitter card metadata. Source art is `docs/og-card.svg` and the generated binary asset is `docs/social-card.png`. To regenerate PNG locally after editing the SVG, use `rsvg-convert`:

```bash
rsvg-convert -w 1200 -h 630 docs/og-card.svg > docs/social-card.png
rsvg-convert -w 512 -h 512 docs/favicon.svg > docs/avatar.png
```

Social platforms may cache existing cards; preview appearance depends on their crawlers. A successfully deployed image and metadata does not guarantee identical presentation on every platform.

No analytics, cookies, external fonts, CDN JavaScript or user-account services are used by the site. The local UI does not transmit experiment parameters or files to SNNCommunity servers; visitors may follow external research links.

## GitHub organization and collaboration

`https://github.com/SNNCommunity` remains a GitHub-owned Organization page and cannot redirect via site code; its README links prominently to the canonical website. The owner reports that the Organization Website field was configured; actual public display needs human visual verification.

**GitHub Discussions:** The Organization currently has no dedicated community source repository. To enable cross-repository discussions, an Organization Owner must visit **Organization Settings → Code, planning, and automation → Discussions**, enable discussions, and select a source repository (the existing `.github` is possible; a dedicated `community` repository is preferred for clean separation). Do not link a nonexistent Discussions page as active.

**Website and avatar:** The `docs/avatar.png` file is ready for an Owner to upload as the Organization avatar. The repository connector does not change Organization profile/avatar, create new repositories, or enable Discussions.

## Release and accessibility checklist

1. Open a PR. Run Node source tests and Python↔JS numeric parity.
2. Require Chromium desktop, tablet and 390/320px checks: no horizontal overflow, clear focus, keyboard controls, data exports, fallback content and readable labels.
3. Review color contrast for text and UI boundaries; check WCAG 2.2 2.5.8 target size and 1.4.11 non-text contrast.
4. Check social card PNG is present and OG/Twitter links use the deployed Pages URL.
5. Merge only with green checks and inspect the resulting GitHub Pages run.
6. Verify real browser navigation and visuals separately from automation.

See [RESEARCH_STANDARDS.md](RESEARCH_STANDARDS.md) for wider scientific contribution policy, and [GOVERNANCE.md](GOVERNANCE.md) for the provisional maintenance model.
