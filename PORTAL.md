# SNNCommunity Next-Generation Portal

This repository now contains a complete static portal in [`docs/`](docs/) that can be published using GitHub Pages directly, with **no package installation or build step**.

## Why a static release rather than an Astro-first build?

The first release prioritizes a working interactive experiment and a robust deployment path that is compatible with the GitHub connector's current constraints. GitHub Pages can publish directly from a repository's `main/docs` directory without a CI toolchain, dependency lock, external build platform or Node runtime. The code remains portable to a future dedicated `SNNCommunity.github.io` repository or an Astro site.

The **GitHub organization owner must activate Pages**; the current GitHub connector cannot change Pages settings or create new repositories:

1. Go to [SNNCommunity/.github Settings → Pages](https://github.com/SNNCommunity/.github/settings/pages).
2. Select **Deploy from a branch**.
3. Select **main** and **/docs**, and save.
4. Wait for GitHub Pages to finish deployment and use the exact URL shown in Settings → Pages.

For this project repository the conventional URL is `https://snncommunity.github.io/.github/`. **Do not announce it as live until GitHub reports a successful deployment.**

After confirmation, the organization Profile README can link directly to the live site. Organization website and custom avatar must also be changed in GitHub Settings by an owner.

## What's in the first release?

- An editorial-style responsive website with entirely self-hosted CSS, JS, SVG and system-font assets.
- An honest founding-stage community overview and actionable links to existing GitHub Issues.
- An interactive **LIF neuron lab** with adjustable membrane time constant, threshold, input amplitude and step/pulse stimulus; canvas trace and spike raster are calculated locally.
- A searchable and filterable directory of curated original SNN resources with external attribution.
- Direct access to contribution, governance, security and community planning.

## Scientific model notes

The lab uses a dimensionless scalar LIF model, with a 1 ms forward-Euler update:

`V[t+1] = V[t] + (dt/tau) * (-V[t] + I[t])`

If `V[t+1] >= threshold`, an event is recorded and `V[t+1]` is reset to zero. The model uses `V[0] = 0`, `dt = 1 ms`, `T = 200 ms`. The step pattern is on for `12 <= t < 188`; the pulse pattern presents a stronger duty-cycled stimulus during the same interval. It is an educational, dimensionless illustration, not biologically calibrated or a performance benchmark.

## Editing and review

- `docs/index.html` — page structure and accessible navigation.
- `docs/styles.css` — responsive and visual design system.
- `docs/app.js` — local deterministic simulation and resource filtering.
- `docs/favicon.svg` — brand symbol.
- `docs/404.html` — fallback page.
- `docs/.nojekyll` — disable Jekyll processing in branch deployment.

Check desktop/mobile, keyboard navigation, reduced-motion preferences, low-width layout, script availability, resource filtering, clipboard failure, mathematical interpretation and GitHub links. For research content, comply with [RESEARCH_STANDARDS.md](RESEARCH_STANDARDS.md).

## Important boundaries

This portal is **independent**, not university-affiliated or officially endorsed by third-party frameworks. The directory is a curated set of *externally maintained* resources, not a claim of original project authorship or completed reproducibility checks. User data is not collected or sent to the site server; there are no analytics, cookies, fonts loaded from a CDN or external runtime dependencies.
