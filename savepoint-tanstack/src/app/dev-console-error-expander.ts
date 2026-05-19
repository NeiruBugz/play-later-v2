/**
 * Dev-only client patch: expand `Error` arguments passed to `console.error`
 * and `console.warn` into plain serializable objects.
 *
 * Why this exists: `@tanstack/devtools-vite` pipes browser console calls to
 * the dev server via JSON-serialized SSE. `Error.prototype.{name,message,stack}`
 * are non-enumerable, so `JSON.stringify(err)` drops them — only explicitly-set
 * own properties like `cause` survive. The piped log ends up as `{ cause: {} }`
 * with the actual failure invisible.
 *
 * Typical offender: TanStack Start's `serverFnFetcher.ts` catch at line ~400:
 *   `onError?.(\`Invalid JSON: ${value}\`, e)`
 * where `e` is the real seroval / RawStream / `fromCrossJSON` error driving a
 * loader-hangs-forever bug. Without this expander, the error is lost.
 *
 * Side-effect import only. No-op on the server and in production builds.
 */

const STACK_LINE_LIMIT = 12;

interface SerializedError {
  __error__: true;
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
  [extra: string]: unknown;
}

function serializeError(err: Error): SerializedError {
  const stack =
    typeof err.stack === "string"
      ? err.stack.split("\n").slice(0, STACK_LINE_LIMIT).join("\n")
      : undefined;
  const out: SerializedError = {
    __error__: true,
    name: err.name,
    message: err.message,
  };
  if (stack !== undefined) out.stack = stack;
  const cause = (err as { cause?: unknown }).cause;
  if (cause !== undefined) {
    out.cause = cause instanceof Error ? serializeError(cause) : cause;
  }
  for (const key of Object.keys(err)) {
    if (key === "name" || key === "message" || key === "stack" || key === "cause") continue;
    out[key] = (err as unknown as Record<string, unknown>)[key];
  }
  return out;
}

function expandArg(value: unknown): unknown {
  return value instanceof Error ? serializeError(value) : value;
}

function patch(method: "error" | "warn"): void {
  const original = console[method].bind(console);
  console[method] = (...args: unknown[]) => {
    original(...args.map(expandArg));
  };
}

if (
  typeof window !== "undefined" &&
  import.meta.env.DEV &&
  !(window as unknown as { __dev_console_error_expander__?: true })
    .__dev_console_error_expander__
) {
  (window as unknown as { __dev_console_error_expander__?: true }).__dev_console_error_expander__ =
    true;
  patch("error");
  patch("warn");
}
