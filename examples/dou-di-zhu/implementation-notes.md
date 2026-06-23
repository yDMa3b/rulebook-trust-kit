# Implementation Notes

The public example package does not ship a game runtime. The implementation references in `rules.yaml` point to package-level fixtures and notes so maintainers can still audit the expected behavior.

Projects that embed this package into an engine should replace these references with engine, bridge, semantic-test, and edge-test paths from their own repository.
