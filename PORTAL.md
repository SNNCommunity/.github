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

The interactive lab demonstrates a **dimensionless discrete-time Leaky Integrate-and-Fire neuron** using forward Euler, a fixed 1 ms step, zero initial state, and hard reset:

```text
V[t+1] = V[t] + (1 ms / tau) * ( -V[t] + I[t] )
if V[t+1] >= threshold: emit a spike at t+1 ms; reset V[t+1] to 0
```

The simulation covers **200 update steps**, producing **201 membrane samples** from `t = 0` through `t = 200 ms`. Two input patterns are available:

- **Step**: amplitude `A` for `12 <= t < 188`, otherwise 0.
- **Pulses**: amplitude `1.75 * A` for the first 22 ms of each 40 ms cycle starting at t=12, restricted to `12 <= t < 188`.

Spike counts and the last interspike interval are derived from recorded event times. Charted spike peaks illustrate the crossing before reset; the stored membrane sample following firing is zero. Input amplitudes and voltages are **normalized, not biologically calibrated**. This site does not make a research-performance or energy-efficiency claim.

## Curated sources

The introductory collection links to independently maintained documentation, frameworks, benchmarks and original research. Indexing a resource **does not validate or certify a paper**, nor does it imply partnership. The resource schema is currently a local static array in `docs/app.js`; move it to separately validated structured content only when the library grows enough to warrant a dedicated data pipeline.

## Release quality gates

The `portal-check.yml` GitHub Actions workflow runs:

- Node.js syntax and source-contract checks.
- Headless Chromium tests for default spike output, subthreshold conditions, parameter reset, resource filtering, mobile navigation and horizontal overflow.
- Accessibility-conscious element and keyboard-navigation smoke checks.
- Test screenshots uploaded as CI artifacts.

This is a smoke-testing baseline, not a replacement for human visual review or a formal accessibility audit.

## Deployment

The current branch-based GitHub Pages source is expected to be **`main /docs`**. An organization owner may review this in [repository Pages settings](https://github.com/SNNCommunity/.github/settings/pages). GitHub publishes changes to the selected source folder after merges to `main`; verify the Pages deployment and actual live page after each release.

The owner controls Organization **avatar, display name, URL and pinned repositories** in GitHub's organization settings; those properties are not set by code in this repository.

## Scientific and community integrity

Contributions should follow [CONTRIBUTING.md](CONTRIBUTING.md), [RESEARCH_STANDARDS.md](RESEARCH_STANDARDS.md), and [GOVERNANCE.md](GOVERNANCE.md). Avoid invented affiliation, artificial community metrics, unsafe credential exposure, or unpublished data. Other GitHub project history and merged PRs remain part of normal Git history even when obsolete files are removed from the working tree.
