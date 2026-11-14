# Evidence packs

An evidence pack holds what was read from NASA's own reports, test matrices and recordings for one investigation: claims about single tests, each with its source. Put each pack in here as its own folder, for example `data/packs/PSI-25/`.
The folder must hold `pack.json`, with the CSV files the loader reads (`pipeline/flamelens_pipeline/packs.py`).

Then, from the repository root:

```bash
cd pipeline && uv run python -m flamelens_pipeline --offline   # checks every pack, merges it, prints what changed
cd .. && pnpm db:setup && pnpm build                        # loads the result into the site
```

To only check the packs and print the scoreboard: `cd pipeline && uv run python -m flamelens_pipeline.packs`.

Rules the loader follows (`pipeline/flamelens_pipeline/packs.py`):

- A value read from NASA's experimental table is never overwritten. A pack value fills a gap, or replaces a value that had been assumed.
- Where a pack and the table disagree, the table's value is used and the case is listed with the quality findings.
- Values from a planned test matrix are left out.
