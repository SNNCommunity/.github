# SNN Research Atlas — taxonomy, metadata and curation protocol

The [SNNCommunity Research Atlas](https://snncommunity.github.io/.github/#library) is an independently curated, **non-exhaustive** directory of published SNN research and original open resources. It is inspired by the community-maintained [TheBrainLab / Awesome-Spiking-Neural-Networks](https://github.com/TheBrainLab/Awesome-Spiking-Neural-Networks), which is primarily a year/venue publication list. SNNCommunity does not scrape, mirror, claim affiliation with, or imply endorsement by that project.

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

## Seven independent discovery dimensions

1. Search terms: paper title, publication, topics, institution and country.
2. Research area: multiple selected topics from the eleven categories (Any/All).
3. Content type: papers vs original tools, docs and other resources.
4. Publication year: only an official **paper publication year**, not an arXiv posting or software repository's first commit.
5. Publication type and venue: Conference / Journal; ICLR, ICML, NeurIPS, ICCV, Science Advances, IEEE periodicals etc.
6. Author-affiliation country and university: **institutional address cited on the publication**, not the author's citizenship.
7. Sorting: newest year, oldest year or title, with yearless software entries last.

Filters intersect (logical AND) across dimensions. Multiple author universities/countries for the same paper are alternatives within the corresponding facet. For example, a China–France co-authored publication will appear under **both** countries, **not** be duplicated into two records. Institution + country matching requires one matching affiliation object.

### What "country–university" means, precisely

`affiliations` is an array of `{university, country, source}` records linked to a **paper's original affiliation source**. Cross-country coauthorship is supported. No "primary nationality" or "leading university" is assigned by default. Research institutes that are not universities should eventually use an explicit institution type; this initial university selector contains verified university-level affiliations only. An unverified author university is omitted rather than invented. "Not verified · paper" returns papers without indexed affiliation evidence; "Not applicable · resource" includes non-paper entries and does not infer any paper author affiliation.

Initial verified examples:

- NeurIPS 2021 SEW-ResNet: Peking University and Peng Cheng Laboratory (China), and Université Toulouse III (France), as identified in the [proceedings manuscript](https://proceedings.neurips.cc/paper/2021/file/afe434653a898da20044041262b3ac74-Paper.pdf).
- ICCV 2021 PLIF: Peking University (China), Université Toulouse III (France), from the [published paper](https://openaccess.thecvf.com/content/ICCV2021/papers/Fang_Incorporating_Learnable_Membrane_Time_Constant_To_Enhance_Learning_of_Spiking_ICCV_2021_paper.pdf).
- ICLR 2025 SpikeLLM: University of Chinese Academy of Sciences and Peking University (China), University of Oxford (UK), from its [ICLR manuscript](https://proceedings.iclr.cc/paper_files/paper/2025/file/510e7d39fce008a3e31de54b8f5be9ac-Paper-Conference.pdf).
- NeurIPS 2025 Spikachu: University of Pennsylvania (US), from [conference author slides](https://neurips.cc/media/neurips-2025/Slides/116071.pdf).
- 2022 Event-based Vision survey: universities in Germany, Switzerland, the UK, Sweden and US, documented in the [survey author affiliation text](https://arxiv.org/pdf/1904.08405).

**Important:** These represent *the cited participating institutions*, not a complete audit of every historic coauthor position. A partial university list must not be described as exhaustive. No ranking, leaderboard or nation-level publication count is inferred from this curated collection.

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

## Testing

```bash
node --check docs/atlas-core.js
node --test tests/atlas-core.test.mjs tests/portal.test.mjs
```

GitHub Actions also checks real Chromium behavior, including topic/year/venue combinations, university + country, unverified affiliations, filter resets, all-results display, 320 px layout and preserved LIF/IF experiments. The Atlas uses native HTML controls, no server, and safe DOM `textContent` construction rather than interpolating catalog fields into HTML.

**The initial 22 entries are deliberately selective rather than a complete mirror of the Awesome list.** The structure is designed to grow through evidence-backed community review.

## Research record pages (V8)

Each indexed research paper is served at `/.github/papers/<id>/` with a stable canonical URL, original publication links, editorial topic associations, separately sourced affiliation evidence and explicit reproduction limitations. These pages do not assert a full authorship mapping or independent model reproduction. Run `node scripts/build-paper-pages.mjs` after changing the catalog to regenerate static pages and the sitemap. Source-linked indexing remains distinct from endorsement.

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

The editorially selected 13 paper detail pages are **a subset of the 395 research works**, not extra papers. They are accompanied by software and learning resources with their own types and are not included in the paper count. All existing scientific verification boundaries, GitHub Pages static architecture and the LIF/IF lab remain intact.

The separate downloadable private ZIP `SNN_Research_Atlas_V13_Final_395_Research_Works.zip` contains a deduplicated **395-work** JSON archive and a standalone offline HTML reader. It preserves **371 author-original abstract records** and **24 source-checked independent editorial research synopses** from the exact October 14 upload; the 24 must never be described as author-origin text. The private archive is not uploaded to the public GitHub repository. Users can read private abstracts in their local offline HTML file instead of uploading a personal JSON onto the public website.

The pinned bibliography snapshot is `TheBrainLab/Awesome-Spiking-Neural-Networks` commit `3695cf0e3d3d8b87a9468467ea8c2b289e033c0e`; updated bibliographic source pointers for the 24 records are sourced from the supplied final V31 source audit. Source-specificity flags are carried over from V31 and are not independent re-verification. Public content does not assert that all 395 papers' experiments have been reproduced.

Regeneration policy: regenerate the 395-work public metadata from the same canonical `workId`-grouped private source; never reintroduce version index positions, separate `corpus.json` and `metadata.json`, aggregate work/version view switches, or a public file-upload control. `tests/public-works.test.mjs` guards these boundaries.
