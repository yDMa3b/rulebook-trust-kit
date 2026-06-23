# Maintainer Workflows

## Add or Update a Rule Package

1. Add source records to `quality/sources.yaml`.
2. Add or update stable rule IDs in `rules.yaml`.
3. Mark product choices as maintainer decisions, not source-backed tradition.
4. Add examples in `quality/examples.json`.
5. Add semantic or edge fixtures under `tests/`.
6. Run `pnpm validate --game <game>`.
7. Run `pnpm trace --game <game>`.
8. Run `pnpm review-pack --game <game>` and send the pack to a domain reviewer.

## Pull Request Review

Reviewers should check:

- source IDs and decision IDs resolve
- rule IDs are stable and unique
- examples reference real rules and tests
- uncertainty is visible in `ambiguities.yaml`
- generated review pack describes remaining risks plainly

## Release Gate

Before tagging a release:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm test
pnpm validate --game dou-di-zhu
pnpm trace --game dou-di-zhu
pnpm review-pack --game dou-di-zhu
```

The release should include the generated trace and review-pack artifacts only when they are useful for reviewers. Generated artifacts are not required in source control.
