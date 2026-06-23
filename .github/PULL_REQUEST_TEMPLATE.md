## Summary

Describe the rule package, schema, CLI, or documentation change.

## Rule Trust Checklist

- [ ] Source or decision references are updated.
- [ ] Rule IDs are stable and unique.
- [ ] Examples or fixtures cover the changed behavior.
- [ ] `pnpm validate --game dou-di-zhu` passes when the example package is affected.
- [ ] `pnpm trace --game dou-di-zhu` passes when rule references are affected.
- [ ] `pnpm review-pack --game dou-di-zhu` still produces a useful human review pack.
- [ ] No private product code, secrets, commercial assets, beta feedback, or third-party mirrors are included.

## Reviewer Notes

List any unresolved ambiguity or domain-review question.
