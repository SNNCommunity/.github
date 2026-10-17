# SNN Research Atlas — taxonomy, metadata and curation protocol

The [SNNCommunity Research Atlas](https://snncommunity.github.io/.github/#library) now indexes **395 deduplicated research works** on the homepage and full `/atlas/` page. A smaller editorial selection of ten papers provides expanded source-linked method notes, and nine separately categorized resources cover software and learning. Bibliographic inclusion is not independent scientific verification. It is inspired by the community-maintained [TheBrainLab / Awesome-Spiking-Neural-Networks](https://github.com/TheBrainLab/Awesome-Spiking-Neural-Networks), which is primarily a year/venue publication list. SNNCommunity does not scrape, mirror, claim affiliation with, or imply endorsement by that project.

## Taxonomy: eleven multi-label research areas

| ID | Area | Representative methods and tasks |
| --- | --- | --- |
| `neuron-dynamics` | Neuron dynamics | LIF / PLIF, adaptation, gating, dendrites, state persistence |
| `learning-plasticity` | Learning & plasticity | Surrogate gradients, STDP, normalization, local and online learning |
| `deep-architectures` | Deep architectures | Deep residual SNNs, spiking Transformers, recurrent SNNs, SSM |
| `coding-conversion` | Coding & conversion | Rate, temporal and latency coding; ANN–SNN conversion |
| `efficiency-hardware` | Efficiency & hardware | Sparse execution, low energy, neuromorphic chips, quantization |
| `event-vision` | Event-based vision | Event cameras, spike streams, perception and reconstruction |
| `robotics-embodied` | Robotics & embodied AI | Perception-action, control, navigation, robotic learning |
| `sequence-language` | Sequence & language | Sequence recognition, language models, time-series tasks |
| `neuroscience-bci` | Neuroscience & BCI | Brain signals, neural decoding, BCI |
| `benchmarks-tools` | Benchmarks & tools | Datasets, evaluation, frameworks, portability |
| `theory-robustness` | Theory & robustness | Formal stability, adversarial/noise robustness |

These are editorial topical tags, not official paper field labels. **A paper may have more than one topic**; assignments are reviewed and not inferred from the conference name.

## Current research discovery and search

The canonical 395-work catalogue is `docs/atlas/works.json`. Both the homepage and Atlas search this same file with `docs/research-core.js`. Search covers titles, indexed author names (currently first author in most cases), DOI, year, venue, topic names and scientific topic aliases. Filters cover topic (including multi-topic Any/All from the homepage), year, venue, bibliographic source type, code-link availability, and sort order. Source-type labels do **not** certify bibliographic verification.

The homepage shows eight cards initially, then 20 more per expansion, as well as a coverage strip with total works, code links and DOI counts from the JSON. The dedicated Atlas begins with 24 cards and adds topic shortcuts, per-record DOI/code links and a detailed record dialog. Ten separately generated curated paper pages remain a subset of the 395 works, not 395 static paper pages. The nine non-paper software/guide links are surfaced only in the dedicated Ecosystem directory.

The full 395-work index does not include verified institutional or country metadata for every paper. Do not describe affiliations from the ten curated records as complete coverage of the full index.

## File schema and scientific constraints

`docs/resources.json`, `schemaVersion=2`:

- `id` unique stable record ID, `title`, `description`, `publisher`, `url`, `code`, `doi` and license metadata.
- `topics`: array of valid taxonomy IDs; at least one.
- `type`: `paper` or original framework / tutorial / tooling / community type.
- `publication`: for papers only, a structured `{kind: Conference|Journal, venue, year}` object; `null` for non-paper resources.
- `affiliations`: verified university/country/source triples on papers; empty for unverified papers and non-paper resources.
- `bibliographySource`: publisher / conference / archival source for a paper's year and venue.
- `verification: indexed_not_reproduced`: all initial entries have been indexed, **none independently reproduced** by the community.
- `license: null`: unresolved license; it is **not** equivalent to public-domain or permissive licensing.

Inclusion is based on traceable metadata, not the magnitude of claims in the abstract. Bibliographic DOI and publishers should be cross-checked with primary proceedings (PMLR, CVF, NeurIPS, ICLR) or publishing records (PubMed, journal sites). The original Awesome list is an excellent *discovery aid*, but the formal bibliographic links and author affiliations must be validated independently before adding fields.

## Adding a paper correctly

1. Locate the official publication page and verify **title, year, publication venue and type**.
2. Add topical tags based on the contribution and experiments, not a keyword-only heuristic.
3. Verify original implementation URL and license independently. No official source code? Keep `code:null`.
4. Open the original manuscript and confirm **author affiliations at the time of publication**. Add each verified university as `{university,country,source}`, preserving multiple countries.
5. If institutions are absent, leave `affiliations:[]`. If the work only exists as an arXiv preprint, do not claim an accepted conference or journal publication.
6. Add source URLs and `indexed_not_reproduced`; validate with the Node tests before merging.

For broader archival coverage, future releases should add ORCID/ROR IDs, full author-affiliation mappings, per-record review dates, citation formats, Crossref/OpenAlex provenance references and an explicit distinguishable "Preprint" publication kind. Those fields are **future work**, not fabricated metadata in this initial version.

## Testing and curated paper pages

Run `node --test tests/research-core.test.mjs tests/public-works.test.mjs tests/portal.test.mjs tests/editorial-copy.test.mjs` for the 395-work source, shared indexing logic and editorial boundary. The Playwright browser smoke suite also checks navigation, filters, source links, responsive viewports and neuron simulation. Browsable standalone paper pages are generated for the ten selected research records by `node scripts/build-paper-pages.mjs`. All other works have shareable Atlas record URLs using `?paper=<id>`.

## Canonical source, topic and deep-link contracts

The public research source is `docs/atlas/works.json`: **395 unique scientific works**, representing **396 historical source versions**. One Spikingformer preprint and formal publication are consolidated as one work. Titles, identifiers and previous `?paper=<id>` URLs remain stable. For compatibility, the original positional `?record=360` link resolves to the associated canonical record.

`docs/research-core.js` supplies the shared source validator, search, sorting, topic counts and source-status labels. The homepage and dedicated Atlas are separate views of the same dataset, not two publication lists. Most indexed multi-author entries currently contain only the first author, and missing DOI or code links remain missing rather than inferred. A source link's type does not prove that its paper and scientific claims have been independently checked.

The ten extended curated paper pages and nine external software/guide links are described in `docs/resources.json`. These ten papers are a subset of the 395 works, while the nine source links correspond to seven distinct external projects browsable at `/ecosystem/`. There is no separate software/guide tab on the homepage. Previous homepage software links using `atlas.format=resource` redirect to the dedicated ecosystem directory.

The index stores no author-supplied abstract paragraphs or offline private research notes. Private reading materials, including any licensed or editorial abstracts, are not deployed to GitHub Pages. Historical version numbers in some work IDs and the `abstractDetailsIncluded:false` metadata flag are retained only for compatibility with published records, not as indicators of a second public corpus.

Current homepage search parameters `atlas.query`, `atlas.topic`, `atlas.mode`, `atlas.year`, `atlas.venue`, `atlas.source`, `atlas.code` and `atlas.sort` map to the standalone Atlas filters. Multi-topic ANY/ALL conditions appear as removable filters. Shared links strip unrelated query parameters. Do not change canonical identifiers or remove historic Atlas migration logic during visual cleanup.

## Provenance and regeneration

The original bibliography's pinned discovery snapshot is `TheBrainLab/Awesome-Spiking-Neural-Networks` commit `3695cf0e3d3d8b87a9468467ea8c2b289e033c0e`. Subsequent source audit flags remain evidence metadata and are not equivalent to independent article-by-article re-verification. Current source-status categories distinguish publisher pages, broader venue indexes and unresolved paper-specific sources. An indexed code link does not establish successful execution or independent reproduction.

`scripts/build-paper-pages.mjs` regenerates the ten curated static paper pages and the sitemap. The generated sitemap contains all five public top-level routes, plus the ten curated paper pages. Run the generator and tests whenever curated records or routes change; CI rejects a mismatched generated artifact. New author, DOI, institution and method relationships should be entered only after verifying primary references and maintaining the 395-work de-duplication contract.
