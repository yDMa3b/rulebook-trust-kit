# Rule Trust Engineering Standard

Rulebook Trust Kit uses three layers of correctness:

1. Source correctness: provenance, region, version, conflicts, and review notes.
2. Mechanical correctness: initialization, legal actions, transitions, scoring, and terminal states match the formal rule package.
3. Product correctness: UI, prompts, settlement, and replay consume rule-engine results instead of inventing game-specific behavior.

## Rule Packages

A package contains:

- `quality/manifest.yaml`: package metadata, status, player count, source IDs, and engine entry.
- `quality/sources.yaml`: sources and maintainer decisions.
- `quality/ruleset.yaml`: wrapper metadata; it must not become a second rule truth.
- `rules.yaml`: machine-consumed rule ID table.
- `quality/examples.json`: golden, illegal, edge, and terminal examples.
- `quality/ambiguities.yaml`: open questions, source conflicts, and platform choices.
- `quality/review.yaml`: mechanical, domain, and community review status.

## Status Ladder

Packages move through:

`DRAFT -> SOURCED -> SPECIFIED -> IMPLEMENTED -> MECHANICALLY_VERIFIED -> DOMAIN_REVIEWED -> PUBLISHED`

Any behavior-changing rule update should refresh source/decision notes, rule IDs, examples, tests, trace output, review status, and changelog notes.

## Source Rules

- AI output is not a source.
- Current code must not be reverse-engineered into traditional rule truth.
- `museum-decision` entries require a stable `decision_ref`.
- Unresolved or blocking uncertainty must not be marked `PUBLISHED`.

## Traceability

Each normative rule should connect:

`source or maintainer decision -> rules.yaml -> implementation/test references -> verification result`

Coverage gaps are allowed during drafting, but they must be visible in validation and review output.
