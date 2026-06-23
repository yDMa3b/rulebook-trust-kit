# Impact and Eligibility Notes

This document explains why Rulebook Trust Kit is a reasonable open-source maintainer project even before it has large download or star counts.

## Public Problem

Long-tail tabletop rules are difficult to preserve in software because the source material is often regional, oral, contradictory, or platform-specific. A rule can be "implemented" and still be untrustworthy if maintainers cannot answer:

- Where did this rule claim come from?
- Is it a traditional rule, a platform choice, or a maintainer decision?
- Which tests exercise it?
- What should a domain reviewer check?
- What changed between releases?

Rulebook Trust Kit makes those questions explicit and machine-checkable.

## Maintainer Burden

Without tooling, maintainers have to manually compare sources, prose rule IDs, examples, tests, implementation notes, and review summaries. That is exactly the kind of repeatable open-source maintenance work where coding agents and API credits can help:

- review pull requests for missing source references
- detect traceability gaps
- draft review packs for domain experts
- summarize release-gate output
- propose tests for newly added rule claims

## Current Eligibility Signals

- Public repository: `https://github.com/yDMa3b/rulebook-trust-kit`
- Primary maintainer: `yDMa3b`
- CI runs install, build, tests, validation, trace, and review-pack generation.
- The repository includes issue templates, a PR template, roadmap issues, and a version tag.
- The example package separates public rule-trust artifacts from private product code.

## Honest Limitation

The project is early and does not yet have broad adoption metrics. The application should emphasize ecosystem importance, active maintenance intent, and the fact that API credits would directly improve repeatable OSS maintainer workflows.
