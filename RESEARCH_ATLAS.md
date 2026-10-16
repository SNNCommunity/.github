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

The homepage shows eight cards initially, then 20 more per expansion, as well as a coverage strip with total works, code links and DOI counts from the JSON. The dedicated Atlas begins with 24 cards and adds topic shortcuts, per-record DOI/code links and a detailed record dialog. Ten separately generated curated paper pages remain a subset of the 395 works, not 395 static paper pages. Nine non-paper tools and guides are separated from the research count.

The full 395-work index does not currently include institution or country metadata for each paper; the earlier country/university facets belong only to the ten-item editorial source catalogue and must not be described as full-corpus search.

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

## V9 correctness and evidence revisions

- Search indexes displayed topic names, their curated multilingual aliases, existing scientific descriptions, verified author names, and publication/institution fields. Multiple search words can match different fields.
- Facet topic counts are conditional on the other active search and metadata selections; they are not whole-corpus counts during a refined search.
- Atlas state is parsed and rendered consistently on entry and browser Back/Forward; dependent country–institution and publication kind–venue fields are restored together.
- Source-linked author lists have an explicit source and may remain `unverified` if an adequate source is not available. These names do not establish a complete author–affiliation mapping.
- Research questions, method notes and evaluation descriptions on paper pages are editorial paraphrases linked to primary publication evidence, not verbatim abstracts and not independently reproduced results.
- `node scripts/build-paper-pages.mjs` first clears the generated paper output directory to prevent obsolete research pages from surviving removed catalog records. CI compares regenerated pages against tracked files.

## Final V13: exactly 395 publicly indexed research works (October 14, 2026)

The public source of truth is `docs/atlas/works.json`. It represents **395 distinct works**, not two views of 396 independent papers. The original 2023 Spikingformer preprint and AAAI 2026 publication are consolidated as one work, with both source links in a version history attached to that single record. The full public index is the first research destination from the landing page.

The public bibliography exposes titles, publication years, venues, indexed first authors and author counts, DOIs, paper/source URLs, code links, provisional research topics, bibliographic source status and source-warning indicators. **It contains zero abstract paragraphs, editorial synopses, private reading notes, or personal caches.** Only 395 works appear in the UI, counters, deep links and public datasets; related versions are not independent paper cards.

The editorially selected 10 paper detail pages are **a subset of the 395 research works**, not extra papers. They are accompanied by software and learning resources with their own types and are not included in the paper count. All existing scientific verification boundaries, GitHub Pages static architecture and the LIF/IF lab remain intact.

The separate downloadable private ZIP `SNN_Research_Atlas_V13_Final_395_Research_Works.zip` contains a deduplicated **395-work** JSON archive and a standalone offline HTML reader. It preserves **371 author-original abstract records** and **24 source-checked independent editorial research synopses** from the exact October 14 upload; the 24 must never be described as author-origin text. The private archive is not uploaded to the public GitHub repository. Users can read private abstracts in their local offline HTML file instead of uploading a personal JSON onto the public website.

The pinned bibliography snapshot is `TheBrainLab/Awesome-Spiking-Neural-Networks` commit `3695cf0e3d3d8b87a9468467ea8c2b289e033c0e`; updated bibliographic source pointers for the 24 records are sourced from the supplied final V31 source audit. Source-specificity flags are carried over from V31 and are not independent re-verification. Public content does not assert that all 395 papers' experiments have been reproduced.

Regeneration policy: regenerate the 395-work public metadata from the same canonical `workId`-grouped private source; never reintroduce version index positions, separate `corpus.json` and `metadata.json`, aggregate work/version view switches, or a public file-upload control. `tests/public-works.test.mjs` guards these boundaries.

### V14 unified homepage

`docs/home-research.js` uses the exact public `docs/atlas/works.json` dataset as the dedicated `/atlas/` browser. **All research = 395** by default, searchable directly on the root. Topic counts and filtered totals are computed from the 395 works, while **Tools & guides = 9** is a separate non-paper mode. The ten curated scientific records are linked only as optional supporting notes on matching canonical works. The former 19-item mixed homepage index and unsupported country/university facets are no longer active. Public records still mirror no author abstracts; the offline private archive remains separate.

### V15: implementation residue audit and unified discovery semantics

V14 already unified the physical corpus file, but the homepage and dedicated Research Atlas still maintained different search implementations, filter normalization, venue/source descriptions, and data checks. The V15 release introduces `docs/research-core.js`, a reusable, framework-independent module providing one 395-work integrity validator and shared Unicode-aware research search, topic counting, source-status labeling and result sorting. Both public pages call this module on the same `docs/atlas/works.json`; `tests/research-core.test.mjs` verifies its behavior against common queries, publication filters, topic combinations and metadata boundaries.

The original **395 canonical IDs** remain untouched, and the one Spikingformer preprint/publication pair still counts as a single scientific work. Retired positional links such as `/atlas/?record=360` now resolve to its stable `?paper=work-spikingformer-spike-driven-residual-learning` ID. These are compatibility redirects only; there are no additional public research records.

Home search parameters (`atlas.query`, `atlas.topic`, `atlas.mode`, `atlas.year` etc.) are mapped to the full browser's `q`, `topic` or `topics`, `mode`, `year` and other supported facets when opening a scientific record or the full Atlas. Multiple inherited topics, including their ANY/ALL mode, are surfaced in a visible, removable filter note rather than hidden in the URL. Switching from the 395-paper index to the nine software/guide resources clears incompatible search and paper-only facet state. Copied research URLs exclude unrelated URL query parameters; published page links retain no local or private content.

**Source-coverage boundaries:** 140 publisher-specific source entries were inherited without independently rechecking every exact version, 205 entries refer to venue/index sources, and 50 still lack a paper-specific source. Eleven works have unresolved year metadata, and 106 list code links. These numbers describe the imported V31 bibliography; they are not additional publication, licensing, author-affiliation, or experiment-reproduction verifications. Public content contains no publisher-authored abstracts, private synopses or personal notes. The separately distributed offline private archive is unchanged.

No duplicate paper datasets, backend service, or alternative knowledge-graph store are introduced. Regression checks include shared search semantics, private-data exclusion, 320px/mobile layouts, cross-page topic-link equivalence, compatibility of previous links, and numerical LIF/IF experiments.
