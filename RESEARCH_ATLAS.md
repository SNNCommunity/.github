# SNNCommunity Research Atlas · scientific ontology and data governance

Website: https://snncommunity.github.io/.github/atlas/

## Canonical corpus and privacy boundary

The public Research Atlas contains **395 unique research works** in `docs/atlas/works.json`.
Each work has a stable public URL using `?paper=<id>`, an indexed bibliographic source,
provisional author metadata and any available original-code or supporting-resource link.
**The public corpus has no abstract paragraphs, private reading notes, personal caches,
per-paper abstract evidence excerpts, duplicate version records or a public file-upload function.**
The submitted private source archive remains separate from GitHub Pages.

`docs/atlas/ontology.json` is the one public controlled vocabulary. It currently defines
**6 scientific groups, 13 research domains and 69 used atomic technical concepts**.
Of the 395 unique works, **226** carry one or more explicitly abstract-supported atomic
technical concept assignments, and **169** do not. There are **280** work–technique
assignments, **159** indexed code/resource links and **92** DOIs. These figures describe
catalog metadata, not independent scientific reproduction or correctness.

## Six top-level groups and thirteen research domains

| Group | Scientific domains |
| --- | --- |
| G1 Neural mechanisms and learning | D01 Neuron and synaptic dynamics; D02 Spike coding and model conversion; D03 Learning, optimization and plasticity |
| G2 Architectures and temporal modeling | D04 Architectures and representation; D05 Temporal state and memory |
| G3 Perception, generation and action | D06 Vision, event perception and 3D; D07 Language, multimodal and generation; D08 Reinforcement learning and embodied AI |
| G4 Software and neuromorphic hardware | D09 Software systems and high-performance computing; D10 Neuromorphic devices and chips |
| G5 Neuroscience and neurointerfaces | D11 Computational neuroscience and BCI |
| G6 Theory and research infrastructure | D12 Theory, robustness and security; D13 Datasets, evaluation and reproducibility |

The controlled tertiary concepts represent **specific technical mechanisms**, not all
interesting keywords in a paper. This intentionally avoids conflating Spiking Transformers
with one of their attention mechanisms, GPU execution with hardware chips, or Spike
Camera input with Event Camera sensing. Model family, learning paradigm, downstream task,
input modality, execution platform, contribution type, publication genre, and extent of SNN
involvement are stored as **orthogonal facets** on each work.

## Scope and evidence

Assignments are based on the supplied, abstract-reviewed 395-work bibliography.
They are **not** an independent examination of every full manuscript, code repository
or reported scientific result. Blank tertiary techniques are a valid outcome of the
abstract-only evidence standard. A source link is evidence that the URL has been indexed,
not that SNNCommunity independently reviewed its contents or reproduced its results.
A link cataloged as code/resource may in some cases point to supplementary materials
rather than an independently verified runnable implementation.

The active search shared by home and Atlas is implemented in `docs/research-core.js`.
Homepage filters are carried to the full Atlas. All user-facing labels and category values
are derived from `docs/atlas/ontology.json`; curated resource metadata in
`docs/resources.json` serves a separate editorial program and does not redefine the
canonical ontology.

## Author-based discovery (at least ten indexed papers)

Both the public homepage and Research Atlas offer the **same 30 normalized
author-name filters** derived entirely from the 395 canonical research works.
The list is computed at runtime by `SNNResearch.authorIndex(items, 10)` from
each paper's **complete** ordered author array, not from first-author summaries,
private analytics files or manually curated rankings.

- Count each `work-*` record once per normalized author key, using the same
  Unicode/case/punctuation normalizer as search. For example, `HuaJin Tang`
  and `Huajin Tang` share a key, but their display spellings in publication
  records remain unchanged.
- Exactly **30** name keys occur in at least **10** distinct works. Across these
  names the set of covered publications contains **181** distinct works.
  Counts are within this collection, not researchers' lifetime productivity.
- The author filter is **exact** after normalization. It can be combined with
  domain, model, learning technique, task, year, source and resource filters.
  Preserve and restore `?author=<normalized-name>` on the Atlas and
  `?atlas.author=<normalized-name>` on the homepage.
- Less frequently occurring authors remain discoverable through full-text
  author-name search; they are only omitted from the dedicated selector.
- These are normalized **name strings**. No ORCID-level or other identity
  disambiguation was performed, so different individuals with the same name
  may be pooled. Do not publish a definitive researcher ranking, affiliation,
  verified identity or productivity claim based on this filter.

The interface displays the eight highest-count names as convenient shortcuts,
the remaining 22 in an expandable directory, and all 30 in a select menu.
Both lists are generated from the same source every time.

## Compatibility and regeneration

Public work IDs are preserved to prevent broken bookmarks. Inbound historical
`?record=` URLs and previous topical URLs are translated to the canonical record/domain.
This compatibility routing does **not** reintroduce historical duplicate publications.

To update the corpus, begin from an approved public-only export derived from the
private canonical source. Ensure titles, identifiers and category lists are independently
checked against the supplied verified local library. Do not publish any private fields;
do not restore deprecated per-version counts or hardcoded 11-topic research navigation.
Update the ontology and source together, run source tests, then run Chromium smoke
tests at desktop/tablet/mobile widths before merging.

Run locally:

```bash
node --test tests/*.test.mjs
node tests/browser-smoke.mjs
```

The publication's static curated-paper-page generator remains
`scripts/build-paper-pages.mjs`. It also regenerates the sitemap, including
the home, Atlas, Ecosystem, Learn, Experiments and ten curated-paper pages.
