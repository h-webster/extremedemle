/**
 * TEMPORARY diagnostic helper for the production 502 investigation — delete
 * this file (and its two call sites in the API routes) once the root cause
 * of the Pointercrate fetch failures on Vercel is found and fixed.
 *
 * Node's fetch (undici) usually throws a bare "fetch failed" TypeError with
 * the actually-useful detail (DNS/TLS/timeout reason) buried in `.cause`,
 * so `err.message` alone is often useless for network-level failures.
 */
export function describeError(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const parts = [err.message];
  let cause = err.cause;
  let depth = 0;
  while (cause && depth < 3) {
    if (cause instanceof Error) {
      parts.push(`cause: ${cause.message}`);
      cause = cause.cause;
    } else {
      parts.push(`cause: ${String(cause)}`);
      cause = undefined;
    }
    depth++;
  }
  return parts.join(" | ");
}
