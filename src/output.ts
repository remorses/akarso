import { stringify } from 'yaml'

/** Print structured data as YAML or JSON to stdout */
export function output(
  data: object | string | number | boolean | null | undefined,
  opts: { json?: boolean; console: { log: (s: string) => void } },
) {
  if (opts.json) {
    opts.console.log(JSON.stringify(data, null, 2))
  } else {
    opts.console.log(stringify(data).trimEnd())
  }
}

/** Print an actionable API rejection and exit, or rethrow anything else.
 *  SpiceflowFetchError carries the HTTP status and the parsed body on
 *  .value; the API puts its human text in `message`, which is where the
 *  fetch client reads error.message from, so it is ready to print. */
export function exitOnApiError({
  error,
  console,
  process,
}: {
  error: Error & { status?: number | string; value?: { code?: string } }
  console: { error(message: string): void }
  process: { exit(code?: number): void }
}): never {
  const status = Number(error.status)
  // 400 with a machine-readable code is a rejection the API wrote for
  // humans (e.g. post_too_long → use a thread).
  const actionable = (status === 400 && error.value?.code) || status === 403 || status === 409
  if (actionable) {
    console.error(error.message)
    process.exit(1)
  }
  if (status === 402) {
    console.error(error.message)
    console.error('Start a 7-day free trial by running:')
    console.error('')
    console.error('  akarso subscribe')
    console.error('')
    process.exit(1)
  }
  throw error
}
