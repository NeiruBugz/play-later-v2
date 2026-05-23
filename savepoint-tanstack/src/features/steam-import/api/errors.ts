import { ValidationError } from "@/shared/lib/errors";

/**
 * Thrown by `importGameToLibraryWorker` when an imported-game row needs a
 * manual IGDB match. The modal branches on `err.name` (survives RPC
 * serialization) and switches to the manual-search view.
 *
 * Extends `ValidationError` rather than introducing a new top-level
 * `AppError` subclass — see `.claude/rules/tanstack/errors.md` ("new
 * AppError subclasses require spec review").
 */
export class NeedsManualMatchError extends ValidationError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
