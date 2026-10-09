# SNNCommunity roadmap

**Last updated: October 2026.** This is a planning document, not a promise of completed features, guaranteed activity, or fixed delivery dates.

## Phase 0 — Foundation

- [x] Establish SNNCommunity as a GitHub Organization.
- [x] Create the public `.github` community-health repository.
- [x] Publish the organization profile, contribution guidance, Code of Conduct, security and support policies.
- [x] Add proposal and documentation issue templates.
- [x] Publish initial governance, resource standards, and roadmap.
- [ ] Configure the organization's public display name, bio, optional website, and avatar in GitHub Settings.
- [ ] Verify organization security settings, owner roles, base permissions, and private vulnerability reporting where available.
- [ ] Check that the organization homepage and reusable issue templates render correctly.

## Phase 0.5 — Interactive portal release

- [x] Design and merge responsive scientific community portal ([PR #6](https://github.com/SNNCommunity/.github/pull/6)).
- [x] Create deterministic LIF neuron experiment with adjustable current, threshold, and time constant.
- [x] Add a searchable resource index with independently maintained source attribution.
- [x] Run Node source tests and Chromium browser smoke checks (desktop/mobile).
- [ ] Activate GitHub Pages from `main /docs` in the repository Settings — see [Issue #7](https://github.com/SNNCommunity/.github/issues/7).
- [ ] Verify the public website URL and link it from the organization profile and Organization Website setting.

## Phase 1 — Community collaboration hub

- [ ] Create a public `SNNCommunity/community` repository with an initial README.
- [ ] Add the repository to the existing GitHub connector authorization if needed.
- [ ] Enable organization-wide GitHub Discussions using `community` as its source repository (GitHub UI).
- [ ] Publish a welcome discussion, question guidelines, and three well-scoped starter tasks.
- [ ] Document the ongoing triage and contributor-response process.

## Phase 2 — Curated learning and research resources

- [ ] Create public `SNNCommunity/snn-resources` repository.
- [ ] Structure entries for neuron models, learning methods, software frameworks, datasets, benchmarks, hardware, and embodied SNN work.
- [ ] Add a sourced initial collection and invite corrections.
- [ ] Review citations, link integrity, duplication, and software licensing.

## Phase 3 — Research reproducibility

- [ ] Select one reproducible, publicly distributable reference experiment.
- [ ] Publish pinned dependencies, data protocol, configuration, launch command, hardware description, seeds, metrics, and run logs.
- [ ] Distinguish successful execution from faithful reproduction and independent replication.
- [ ] Assess whether a separate `snn-reproductions` repository is warranted by contributor activity.

## Long-term

- Develop interoperable numerical and performance-testing tools.
- Encourage sustained technical review across frameworks and hardware platforms.
- Grow SNN-related event perception and embodied intelligence as evidence-backed, maintainable initiatives.
- Revisit governance once there are independent, regular contributors.

## How to propose a change

Open a [community proposal issue](https://github.com/SNNCommunity/.github/issues/new/choose), describe a measurable user or research need, scope a small initial version, and identify supporting references. Changes to this roadmap should be reviewed in pull requests.

[Governance](GOVERNANCE.md) · [Contribution guide](CONTRIBUTING.md)
