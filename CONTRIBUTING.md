# Contributing

Rulebook Trust Kit is meant for maintainers who want rule changes to be sourced, traceable, testable, and reviewable.

## Good First Contributions

- Add a small rule package example with clear sources and tests.
- Improve schemas or validation warnings.
- Add review-pack templates for domain reviewers.
- Fix documentation that makes the maintainer workflow easier to repeat.

## Rule Package Expectations

- Do not use AI output as a source.
- Do not infer traditional rules from implementation code.
- Mark product or platform choices as `museum-decision` with a `decision_ref`.
- Keep source references, rule IDs, examples, tests, and review notes synchronized.

## Pull Request Checklist

- Run `pnpm test`.
- Run `pnpm validate --game dou-di-zhu` if you touched the example package.
- Update docs when changing CLI behavior or schema fields.
- Do not include private product code, commercial assets, private feedback, secrets, or third-party mirrors.
