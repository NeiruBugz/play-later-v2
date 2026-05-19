/**
 * Internal IGDB transport errors. NOT part of the public AppError taxonomy —
 * `shared/api/igdb/` callers (search.ts, get-game-*.ts) re-throw these as
 * `UpstreamError` at the module boundary, lifting these fields into context.
 *
 * IGDB v4 returns error bodies as a JSON array:
 *   [{ "title": "Syntax Error", "status": 400, "cause": "Expected , at ..." }]
 * In practice `cause` is frequently empty — `title` + the query we sent are
 * the most useful triage signals.
 */

export interface IgdbErrorEnvelope {
  /** IGDB-reported error title, e.g. "Syntax Error", "Invalid Field". */
  igdbTitle?: string;
  /** IGDB-reported status (mirrors HTTP status in practice). */
  igdbStatus?: number;
  /** IGDB-reported cause string. Often empty — do not rely on it alone. */
  igdbCause?: string;
}

export interface IgdbHttpErrorContext extends IgdbErrorEnvelope {
  /** HTTP status code from the IGDB response. */
  status: number;
  /** HTTP status text from the IGDB response. */
  statusText: string;
  /** Endpoint path, e.g. "/games". */
  resource: string;
  /** Apicalypse query body we sent. Highest-signal triage field. */
  query: string;
  /** Per-call UUID — threads request/log lines together. */
  requestId: string;
  /** Cloudflare ray id if present (cross-reference with IGDB support). */
  cfRay?: string;
  /** IGDB-side request id if present (`x-request-id`). */
  xRequestId?: string;
  /** Truncated raw body when JSON parsing failed. ≤ 1 KB. */
  bodySnippet?: string;
}

const BODY_SNIPPET_MAX = 1024;

export class IgdbHttpError extends Error {
  public readonly context: IgdbHttpErrorContext;

  constructor(message: string, context: IgdbHttpErrorContext) {
    super(message);
    this.name = "IgdbHttpError";
    this.context = context;
  }
}

/**
 * Try to lift an IGDB error envelope out of a raw response body.
 * Returns `{}` if the body isn't shaped like an IGDB error.
 * Always also returns `bodySnippet` so callers can keep the raw payload.
 */
export function parseIgdbErrorBody(
  raw: string
): IgdbErrorEnvelope & { bodySnippet?: string } {
  const snippet =
    raw.length > BODY_SNIPPET_MAX ? `${raw.slice(0, BODY_SNIPPET_MAX)}…` : raw;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { bodySnippet: snippet };
  }

  const first = Array.isArray(parsed) ? parsed[0] : parsed;
  if (typeof first !== "object" || first === null) {
    return { bodySnippet: snippet };
  }

  const obj = first as Record<string, unknown>;
  const envelope: IgdbErrorEnvelope & { bodySnippet?: string } = {
    bodySnippet: snippet,
  };
  if (typeof obj.title === "string") envelope.igdbTitle = obj.title;
  if (typeof obj.status === "number") envelope.igdbStatus = obj.status;
  if (typeof obj.cause === "string" && obj.cause.length > 0) {
    envelope.igdbCause = obj.cause;
  }
  return envelope;
}

/** Lift the structured context off an unknown thrown value, when possible. */
export function igdbContextFromThrown(
  cause: unknown
): Partial<IgdbHttpErrorContext> | undefined {
  return cause instanceof IgdbHttpError ? cause.context : undefined;
}
