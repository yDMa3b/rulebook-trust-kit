# Roadmap

Rulebook Trust Kit is intentionally small in `v0.1.x`. The near-term goal is to prove that rule packages can be reviewed like software artifacts: sourced, diffable, testable, and auditable.

## v0.1.x: Public Maintainer Loop

- Keep the compact `dou-di-zhu` package green in CI.
- Add PR templates and issue templates for rule package work.
- Add a reusable pull-request gate for changed rule packages.
- Publish copy-ready review packs for domain reviewers.

## v0.2.x: More Rule Families

- Add a second public example from another rule family.
- Add package-level status badges or generated summaries.
- Improve source/decision validation for ambiguous regional rules.

## v0.3.x: Maintainer Automation

- Provide a composite GitHub Action for `validate`, `trace`, and `review-pack`.
- Add changed-package detection.
- Add optional Codex-assisted PR summary prompts that never include private product data.

## Non-Goals

- This repository will not publish private product code, commercial assets, beta feedback, release secrets, or third-party mirrors.
- This repository will not claim domain correctness without human review.
