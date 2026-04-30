# Service Layer

Services hold business logic. Each service method returns its data type directly on success and throws a typed error from `@/shared/lib/errors` (or a co-located `services/<domain>/errors.ts`) on failure.

For architectural rules, error model, naming conventions, and per-service inventory, see [`CLAUDE.md`](./CLAUDE.md).

For the design rationale behind the typed-throw model (vs the prior `Result`-wrapper pattern this layer used through 2026-04), see [`context/decisions/DAL_TYPED_THROW.md`](../../../context/decisions/DAL_TYPED_THROW.md).

## At a glance

```typescript
// service
async function getGameDetails(igdbId: number): Promise<Game> {
  const game = await findGameByIgdbId(igdbId);
  if (!game) throw new NotFoundError("Game not found", { igdbId });
  return game;
}

// caller (server action) — wrapper at shared/lib/server-action/create-server-action.ts
//                          catches and serializes the throw into ActionResult.error
const game = await gameService.getGameDetails(igdbId);

// caller (RSC page) — try-then-render
let game: Game;
try {
  game = await gameService.getGameDetails(igdbId);
} catch (error) {
  if (error instanceof NotFoundError) notFound();
  throw error;
}
return <GameView game={game} />;

// caller (handler)
try {
  const game = await gameService.getGameDetails(igdbId);
  return { success: true, data: game, status: 200 };
} catch (error) {
  return mapErrorToHandlerResult(error, logger);
}
```

## Testing

Unit tests mock repository functions, assert raw return values for happy paths, and assert typed throws for error paths via `await expect(...).rejects.toThrow(NotFoundError)`. Use `vi.resetAllMocks()` in `beforeEach` (not `clearAllMocks()`) to drain `mockResolvedValueOnce` queues between tests.
