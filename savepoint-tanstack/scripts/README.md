# Scripts

## backfill-game-enrichment

One-off, rerunnable backfill of IGDB times to beat onto `Game` rows that were never enriched (`timesToBeatFetchedAt IS NULL`). Asks IGDB for 10 games per request, 300 ms apart. A game IGDB has no times for is stamped as fetched, so a rerun makes no IGDB calls. Prints `N of M games have a credits time`.

```bash
pnpm --filter savepoint-tanstack backfill:enrichment
```

Runs against the database in `POSTGRES_PRISMA_URL` from `.env`; point it at the target environment deliberately.
