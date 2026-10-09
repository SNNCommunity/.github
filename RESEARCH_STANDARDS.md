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
