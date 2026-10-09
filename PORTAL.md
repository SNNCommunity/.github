# SNN Community — Website and engineering guide

**Canonical public website:** https://snncommunity.github.io/.github/

**Status:** GitHub's Pages deployment workflow reported a successful deployment to this URL on October 9, 2026. Public browsing should still be rechecked when verifying later changes. The published site is the `docs/` folder on `main`; no build step is required.

## Single source of truth

```text
docs/
├── index.html       # The website structure, semantics and content
├── styles.css       # Responsive, light editorial visual language
├── app.js           # LIF simulation, resource filters and navigation
├── favicon.svg      # Canonical compact community icon
├── 404.html         # Pages fallback
└── .nojekyll        # Prevent Jekyll processing
```

There are **no other website themes, legacy assets, generators, frameworks, or runtime dependencies** in the published release. The GitHub organization profile uses `docs/favicon.svg` so the mark has only one source.

## Local preview

From the repository root:

```bash
python3 -m http.server 8000 --directory docs
```

Open `http://localhost:8000/`. There are no Node or Python runtime requirements for visitors. Node is used only for development tests.

## Mathematical definition

The interactive lab demonstrates a **dimensionless discrete-time Leaky Integrate-and-Fire neuron** using forward Euler, a fixed 1 ms step, zero initial state, and hard reset. Every parameter is normalized rather than biologically calibrated:

```text
V[t+1] = V[t] + (1 ms / tau) * ( -V[t] + I[t] )
if V[t+1] >= threshold: emit a spike at t+1 ms; reset V[t+1] to 0
```

The simulation covers **200 update steps**, producing **201 membrane samples** from `t = 0` through `t = 200 ms`. Two input patterns are available:

- **Step**: amplitude `A` for `12 <= t < 188`, otherwise 0.
- **Pulses**: amplitude `1.75 * A` for the first 22 ms of each 40 ms cycle starting at t=12, restricted to `12 <= t < 188`.

Spike counts and the last interspike interval are derived from recorded event times. Charted spike peaks illustrate the crossing before reset; the stored membrane sample following firing is zero. Input amplitudes and voltages are **normalized, not biologically calibrated**. This site does not make a research-performance or energy-efficiency claim.

## Reproducible experiment controls

The live lab includes **quiet, regular-firing, and pulsed-input presets**. Sliders and input patterns can be changed independently, then reset to the default configuration.

- **Share setup:** encodes the four scalar controls as validated, bounded URL query parameters (`tau`, `threshold`, `current`, `mode`). Opening a shared link restores the setup entirely in the browser. If clipboard access is restricted, the URL is displayed in a selectable field.
- **Copy JSON:** exports the current model protocol and parameters to the clipboard, if browser permissions allow.
- **Download CSV:** stores 201 state observations, including `t=0`, their post-reset membrane values, a binary spike event indicator, and the current injected over the **previous** 1 ms update interval. Input is intentionally empty at `t=0`; the last row represents the state after the 200th interval. The first two metadata comment lines start with `#` (for example, use `comment='#'` when reading with pandas).
- **Save plot:** exports the current rendered canvas as PNG. The plotted voltage briefly reaches threshold immediately before a spike resets the stored state to zero. PNG curves are educational visualizations; the CSV is the precise time-series source.

The exported CSV identifies the exact normalized forward-Euler model; it is not a biological recording or a benchmark result. Generated files are created client-side and never uploaded to our server. The share URL includes model parameters but no private data, credentials, or recorded user information.

## Official entry points

- Public scientific portal: https://snncommunity.github.io/.github/
- Organization identity and code collaboration: https://github.com/SNNCommunity
- GitHub cannot externally redirect its organization profile URL. The organization `profile/README.md` therefore features a prominent link into the portal.
- GitHub Organization **Settings → Public profile → Website** should also be set to the portal URL by an Owner. The repository connector does not expose organization metadata administration.

## Curated sources

The introductory collection links to independently maintained documentation, frameworks, benchmarks and original research. Indexing a resource **does not validate or certify a paper**, nor does it imply partnership. The resource schema is currently a local static array in `docs/app.js`; move it to separately validated structured content only when the library grows enough to warrant a dedicated data pipeline.

## Release quality gates

The `portal-check.yml` GitHub Actions workflow runs:

- Node.js syntax and source-contract checks.
- Headless Chromium tests for default spike output, subthreshold conditions, presets, parameter reset, share-link restoration, file exports, resource filtering, mobile navigation and horizontal overflow.
- Accessibility-conscious element and keyboard-navigation smoke checks.
- Test screenshots uploaded as CI artifacts.

This is a smoke-testing baseline, not a replacement for human visual review or a formal accessibility audit.

## Deployment

The current branch-based GitHub Pages source is expected to be **`main /docs`**. An organization owner may review this in [repository Pages settings](https://github.com/SNNCommunity/.github/settings/pages). GitHub publishes changes to the selected source folder after merges to `main`; verify the Pages deployment and actual live page after each release.

The owner controls Organization **avatar, display name, URL and pinned repositories** in GitHub's organization settings; those properties are not set by code in this repository.

## Scientific and community integrity

Contributions should follow [CONTRIBUTING.md](CONTRIBUTING.md), [RESEARCH_STANDARDS.md](RESEARCH_STANDARDS.md), and [GOVERNANCE.md](GOVERNANCE.md). Avoid invented affiliation, artificial community metrics, unsafe credential exposure, or unpublished data. Other GitHub project history and merged PRs remain part of normal Git history even when obsolete files are removed from the working tree.
