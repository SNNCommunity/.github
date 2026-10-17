# SNN Community portal · Maintainer guide

**Website:** https://snncommunity.github.io/.github/  
**Source:** `main/docs` of `SNNCommunity/.github`  
**Primary branch:** `main` · Static GitHub Pages, no runtime build.

## Directory overview

- `docs/index.html` — search-first homepage, complete bibliography preview, and interactive neuron experiment.
- `docs/atlas/` — dedicated 395-work research browser.
- `docs/ecosystem/` — deduplicated open software directory, fed by `docs/resources.json`.
- `docs/learn/` and `docs/experiments/` — independent learning and numerical experiment workspaces.
- `docs/portal.css` — shared layout and typography for standalone workspaces.
- `docs/styles.css` — responsive design tokens, accessibility and scientific figure styling.
- `docs/neuron-core.js` — pure numerical reference used by the browser.
- `docs/app.js` — neuron plot, parameter controls and mobile navigation.
- `docs/home-research.js` and `docs/research-core.js` — one public bibliography and common research filtering.
- `docs/atlas/works.json` — authoritative public 395-work bibliography without abstracts.
- `docs/resources.json` — ten curated paper records and nine external software/learning links.
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

The homepage initially renders **eight** paper cards from the shared 395-work bibliography and reveals 20 more per click. Software and learning resources are instead available at `/ecosystem/`, where nine indexed links correspond to seven distinct external projects. The homepage supports full-corpus title, indexed-author, topic and DOI search, Any/All topic matching, source/code/year/venue filters, and shareable URLs. The Atlas initially renders 24 paper cards, with separate code and DOI links and quick topic shortcuts. For most papers only the first author is currently indexed, so search does not yet cover all coauthors. The homepage coverage strip and domain labels are computed from `docs/atlas/works.json` and `docs/atlas/ontology.json` and can toggle code-only results. In the Atlas, facet chips and the URL retain filter state on Back/Forward navigation.

## Research resource governance

`docs/resources.json` is a separate editorial directory (10 curated papers and 9 external resource links); the canonical public 395-work research catalog is `docs/atlas/works.json` and its atomic classification vocabulary is `docs/atlas/ontology.json`. It records topics, original URLs, formal year and venue for papers, DOI when confirmed, code and license sources, and cited university/country author affiliations where verified. Entries remain `indexed_not_reproduced`. The pure `docs/research-core.js` module handles full-corpus bibliographic search; `docs/atlas-core.js` supports the separately curated records. **Country means academic author affiliation, not nationality**; author affiliation is never inferred for software. Null license means **not validated**, not public domain. See [RESEARCH_ATLAS.md](RESEARCH_ATLAS.md) for the taxonomy, venue/year rules and evidence model.

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

## Current page and compatibility contract

The homepage searches the same **395 unique research works** as `/atlas/`. The public corpus is one record per scientific work, without a historical duplicate-version table. The homepage initially displays eight research cards and expands by 20; the Atlas begins with 24. All advanced research filters and shareable `atlas.*` homepage search parameters remain supported.

Standalone pages are `/ecosystem/`, `/learn/` and `/experiments/`. The ecosystem directory groups nine canonical links into seven distinct external projects. The homepage no longer embeds a second software browser or duplicate learning-card section. Old homepage URLs using `atlas.format=resource` redirect to `/ecosystem/`. Existing `/atlas/?paper=<id>` work links and historic positional `?record=` compatibility remain in the dedicated Atlas.

The static paper-page generator owns `docs/sitemap.xml`; never hand-edit the sitemap without updating `scripts/build-paper-pages.mjs`. That generator publishes the homepage, Atlas, the three standalone routes and ten curated paper pages. Full original abstracts, private evidence excerpts and offline private research notes must never be included in any public file or generated asset. The public ontology has 6 groups, 13 domains and 69 currently used atomic techniques. Scientific facets separate models, tasks, modalities, training paradigms, execution platforms, research scope and bibliographic genre. The corpus has 159 indexed implementation/resource links, which may include supplementary material.

Run the test suite and confirm that tracked generated files remain deterministic:

```bash
node scripts/build-paper-pages.mjs
node --test tests/*.test.mjs
node tests/browser-smoke.mjs
```

Browser tests require the repository's Playwright dependencies and Chromium installation. Review route links, responsive overflow, filters, paper coverage and the LIF/IF reference before merging.
