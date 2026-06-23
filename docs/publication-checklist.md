# Publication Checklist

Before making the repository public:

- `README.md` explains the project without private product context.
- `LICENSE`, `LICENSE-DOCS.md`, `NOTICE`, `CONTRIBUTING.md`, and `SECURITY.md` exist.
- `pnpm install --frozen-lockfile` succeeds.
- `pnpm build` succeeds.
- `pnpm test` succeeds.
- `pnpm validate --game dou-di-zhu` succeeds.
- `pnpm trace --game dou-di-zhu` succeeds.
- `pnpm review-pack --game dou-di-zhu` succeeds.
- No `.env`, token, Steam/AppID private config, beta feedback, commercial media, or third-party mirror is present.
- GitHub repository visibility is public.
- First tag is `v0.1.0`.
