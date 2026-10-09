# Contributing to SNNCommunity

Thank you for helping build an open, reproducible SNN community. Contributions of any size are welcome, including typo fixes, technical corrections, tutorial improvements, tests, curated resources, and research-reproduction reports.

## Where to contribute

- **Organization profile, guidelines, and templates:** use this `.github` repository.
- **Other projects:** contribute to the repository responsible for that topic once it has been published.
- **Ideas and questions:** check [SUPPORT.md](SUPPORT.md) to find the right channel; the central community discussion space is still being established.

Please avoid publishing unpublished results, confidential information, private keys, proprietary datasets, or material you are not authorized to distribute.

## Before opening a pull request

1. Search existing issues and PRs to avoid duplicates.
2. Start with a small, clearly described change.
3. Explain motivation, scope, and any trade-offs.
4. Add references to primary sources where appropriate.
5. Check rendered Markdown, links, formatting, and any relevant tests.
6. Be willing to revise the contribution after review.

For major changes, open an issue first. Not every proposal will be adopted; maintainers will aim to explain decisions.

## Research and paper resources

For each paper or tool, please provide:

- Title, author(s), year, and authoritative URL (DOI, proceedings, or arXiv).
- Official code or project link, if available; distinguish it from third-party implementations.
- Research category and task/dataset when applicable.
- License and reuse restrictions, if known.
- Clearly labeled status: **listed only**, **executed**, **partially reproduced**, or **reproduced**.

Do **not** describe a paper as independently reproduced merely because its official code runs. Report who executed it, under which conditions, and with which evidence.

## Reproducibility contributions

A useful experiment report includes:

- Precise data source, version, preprocessing, and train/validation/test splits.
- Architecture, neuron parameters, time steps, optimizer, schedule, and random seeds.
- Dependencies, device and accelerator information, commands, and commit revision.
- Metrics, aggregation method, observed results, and deviations from the original paper.
- Failed attempts and known limitations, not only successful runs.
- Dataset and artifact licensing; links to permitted outputs instead of uploading restricted data.

Comparisons must account for differing hardware, time-step counts, model sizes, and evaluation protocols.

## Code contributions

- Prefer small PRs with documented behavior.
- Include a minimal runnable example and tests when practical.
- Avoid introducing required credentials or privileged execution into CI.
- Use a clear license compatible with the target repository; a license in one repository does not automatically apply to another.
- Attribute third-party material and respect patents, licenses, academic collaboration agreements, and double-blind publication policies.

## Review and attribution

Maintainers review submissions for correctness, relevance, maintainability, and licensing. Review is not a guarantee of scientific validity or endorsement. Contributor identity remains associated with Git history; report additional collaborators when relevant.

Please also read our [Code of Conduct](CODE_OF_CONDUCT.md).
