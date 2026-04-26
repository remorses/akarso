import { goke } from 'goke'
import { z } from 'zod'

/** Create a goke instance with the shared global options (--api-key, --json) */
export function createGroup() {
  return goke()
    .option(
      '--api-key [key]',
      z
        .string()
        .describe(
          'API key (overrides ZERNIO_API_KEY env and ~/.akarso/config.json)',
        ),
    )
    .option('--json', 'Output raw JSON instead of YAML')
}
