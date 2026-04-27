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
