# Research resource and reproducibility standards

SNNCommunity aims to make resources useful to both new learners and research practitioners. This document is a **contribution policy**, not a claim that listed experiments have already been independently verified.

## Research resource entry

Include the following when applicable:

| Field | Required information |
| --- | --- |
| Citation | Title, authors, year, conference/journal or arXiv, canonical link |
| Topic | Neuron dynamics, learning, architectures, event sensing, neuromorphic hardware, robotics, etc. |
| Code | Official implementation URL clearly distinguished from third-party reproductions |
| License | Declared license; state “not identified” when unknown |
| Task | Datasets and tasks where the method was evaluated |
| Evidence | Paper-reported claims versus externally reproduced claims |
| Status | Resource-only, executed, partially reproduced, reproduced |
| Review | Reporter, reviewer (if any), date, notes about uncertainty |

Avoid claims such as “SOTA,” “energy efficient,” or “verified” without a precise metric, task protocol, date, and source.

## Reproduction report

A report should record at minimum:

1. Exact source revision and implementation provenance.
2. Dataset release, permitted access path, preprocessing and official split details.
3. Architecture, neuron reset/detach rules, time steps, batch size, optimizer, and training schedule.
4. Libraries, CUDA/GPU environment, random seeds, and commands.
5. Metrics with aggregation, confidence intervals or across-seed variation where applicable.
6. Expected numbers, observed numbers, tolerance agreed **before** interpreting outcomes.
7. Deviations, failed runs, known limitations, and artifacts permitted for redistribution.

### Status labels

- **Resource-only:** paper or project is indexed, but no execution evidence is attached.
- **Executed:** a configuration was run and artifacts are supplied; the paper's claims have not necessarily been matched.
- **Partially reproduced:** some predefined endpoints or settings match within stated tolerances while others do not.
- **Reproduced:** the explicitly identified claims match under a documented, auditable protocol.

**Independently reproduced** is a separate attribute and requires a reviewer or implementation independent of the authorship being assessed. These labels should never be mistaken for journal peer review or a blanket certification of correctness.

## Benchmark integrity

Do not compare accuracy or efficiency across mismatched datasets, sample splits, time steps, hardware, simulation backends, training budgets, or measurement boundaries without clearly identifying those differences. Energy claims require documented power measurement or a clearly named estimation model, not an inference from spike count alone.

## Responsible publication

Do not redistribute restricted datasets, private checkpoints, confidential collaboration materials, or code subject to double-blind submission constraints. Respect licenses and cite original work. Record negative outcomes and limitations as well as successes.

[Community governance](GOVERNANCE.md) · [Contributing](CONTRIBUTING.md)

## Public research copy and editorial maintenance

The public site is a research discovery interface, not a release note or a compliance report. Visitor-facing copy should answer a concrete question: What paper is this? Who wrote it? Where was it published? Which research topic does it cover? Where can the original publication or code be found?

Use concise, source-specific labels. Distinguish an individual publisher page from a conference-wide index, and distinguish a listed code repository from a tested reproduction. Missing years, incomplete author lists, provisional topics and unresolved source identities must stay explicit; do not fill them from guesses. Every public paper card derives from the single 395-work `docs/atlas/works.json` index and contains no publisher abstract or personal reading notes.

Avoid repeatedly announcing that every card is a “public metadata record”, an “independent research index”, “not reproduced”, or “not a verbatim abstract”. Keep the general coverage note once near the research filters; put a specific source warning inside the affected record; describe independent replication only in a relevant evidence section. Research method and evaluation paragraphs in the ten extended paper notes must stay grounded in linked publications, not overwritten with generic disclaimers or generated claims.

Do not copy-paste an author-independent AI-style “Question / Method / Results / Limitations” narrative into the 395-paper public dataset. The ten extended paper notes may include a short question, concrete method and author-reported evaluation scope where supported. Do not invent absent metrics, author affiliations or results.

Maintain both the deterministic paper-page generator (`scripts/build-paper-pages.mjs`) and committed HTML together. Source links in one link group must not duplicate the same URL under several buttons. Update public-facing copy regression checks in `tests/editorial-copy.test.mjs` when the editorial presentation changes. Keep the original 395-work/396-source-version integrity and public/private boundary tests intact.
