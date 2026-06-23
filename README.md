# Rulebook Trust Kit

[![CI](https://github.com/yDMa3b/rulebook-trust-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/yDMa3b/rulebook-trust-kit/actions/workflows/ci.yml)

Verifiable rule packages and maintainer workflows for tabletop games.

Rulebook Trust Kit helps maintainers turn game rules into source-backed, testable, reviewable packages. It is designed for long-tail board and card games where rules may be regional, orally transmitted, disputed, or scattered across community sources.

The first public example is a compact `dou-di-zhu` package extracted from Chinese Board Game Museum's rule-trust engineering work. This repository intentionally excludes the private product shell, Steam/APK release configuration, commercial assets, beta feedback, and third-party mirrors.

## Why This Exists

Rules are easy to write down and hard to trust. A useful rule package needs more than prose:

- source or decision references for each normative claim
- stable rule IDs for implementation and tests
- examples for legal, illegal, edge, and terminal cases
- traceability reports for maintainers and reviewers
- human review packs for domain experts

This repository provides a small schema set, a CLI, and one example package so maintainers can repeat that workflow.

## Maintainer Signals

- CI runs install, build, unit tests, validation, trace, and review-pack generation.
- A dedicated Rule Package Gate is available for pull requests that touch examples, schemas, or CLI code.
- Issue templates and a PR template guide source-backed rule package contributions.
- The roadmap is public in [ROADMAP.md](ROADMAP.md).
- The Codex for Open Source application draft is in [docs/codex-for-oss-application.md](docs/codex-for-oss-application.md).

## Quick Start

```bash
pnpm install --frozen-lockfile
pnpm validate --game dou-di-zhu
pnpm trace --game dou-di-zhu
pnpm review-pack --game dou-di-zhu
pnpm test
```

Generated artifacts are written under `artifacts/` and are ignored by git.

## Repository Layout

```text
schemas/                         JSON schemas and example protocol shapes
examples/dou-di-zhu/             Compact public rule package example
packages/rule-trust-cli/         validate, trace, and review-pack commands
docs/                            Maintainer workflows and OSS application notes
```

## CLI Commands

```bash
pnpm validate --game dou-di-zhu
pnpm trace --game dou-di-zhu
pnpm review-pack --game dou-di-zhu
```

- `validate` checks package files, manifest schema, source references, rule IDs, decisions, examples, and test references.
- `trace` emits a source/decision -> rule -> implementation/test matrix.
- `review-pack` creates a Markdown packet for human domain review.

## Licensing

Code is licensed under Apache-2.0.

Documentation, rule package prose, and example data are licensed under CC BY 4.0 unless a file says otherwise.

## Project Status

This is an early public extraction. The goal for `v0.1.x` is to make the maintainer workflow understandable and runnable, not to publish a comprehensive rule corpus.
