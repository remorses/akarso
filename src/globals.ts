import { goke } from 'goke'
import { z } from 'zod'

// CLI options accept friendly lowercase platform names, matching the API
// platform names 1:1. The only alias is `x` → `twitter`.
const platformValues = [
  'x',
  'twitter',
  'instagram',
  'facebook',
  'linkedin',
  'tiktok',
  'youtube',
  'threads',
  'pinterest',
  'bluesky',
  'googlebusiness',
] as const

export type Platform = (typeof platformValues)[number]

/** API platform name for a CLI platform name (x → twitter, everything
 *  else passes through unchanged). */
export function toApiPlatform(platform: string) {
  return (platform === 'x' ? 'twitter' : platform) as
    | 'twitter' | 'instagram' | 'facebook' | 'linkedin' | 'tiktok'
    | 'youtube' | 'threads' | 'pinterest' | 'bluesky' | 'googlebusiness'
}

export const platforms = {
  schema: z.enum(platformValues),
  options: [
    { value: 'x', label: 'X (Twitter)' },
    { value: 'twitter', label: 'X (Twitter)' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'threads', label: 'Threads' },
    { value: 'pinterest', label: 'Pinterest' },
    { value: 'bluesky', label: 'Bluesky' },
    { value: 'googlebusiness', label: 'Google Business Profile' },
  ] satisfies Array<{ value: Platform; label: string }>,
}

/** Create a goke instance with the shared global options (--api-key, --api-url, --json, --profile) */
export function createGroup() {
  return goke()
    .option(
      '--api-key [key]',
      z
        .string()
        .describe(
          'API key (overrides AKARSO_API_KEY env and ~/.akarso/config.json)',
        ),
    )
    .option(
      '--api-url [url]',
      z
        .string()
        .describe('Server URL (overrides AKARSO_API_URL env, defaults to akarso.co)'),
    )
    .option(
      '--profile [id]',
      z
        .string()
        .describe(
          'Profile (workspace) ID to operate on, overriding the API key\'s pinned profile. Use `profiles list` to see available IDs.',
        ),
    )
    .option('--json', 'Output raw JSON instead of YAML')
}
