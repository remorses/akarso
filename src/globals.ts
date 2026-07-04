import { goke } from 'goke'
import { z } from 'zod'

// CLI options accept friendly lowercase platform names; the API uses
// UPPER_SNAKE platform types. toApiPlatform maps between the two.
const platformValues = [
  'facebook',
  'instagram',
  'linkedin',
  'x',
  'twitter',
  'tiktok',
  'youtube',
  'threads',
  'reddit',
  'pinterest',
  'bluesky',
  'googlebusiness',
  'mastodon',
  'discord',
  'slack',
] as const

/** Platforms that support importing comments from published posts. */
const commentPlatformValues = [
  'facebook',
  'instagram',
  'linkedin',
  'youtube',
  'tiktok',
  'reddit',
  'threads',
  'mastodon',
  'bluesky',
] as const

/** Platforms that support publishing comment replies. */
const commentReplyPlatformValues = [
  'tiktok',
  'youtube',
  'instagram',
  'facebook',
  'threads',
  'linkedin',
  'reddit',
  'mastodon',
  'discord',
  'slack',
  'bluesky',
] as const

/** Platforms whose account needs a selected channel before posting works. */
const channelSelectPlatformValues = [
  'facebook',
  'instagram',
  'linkedin',
  'youtube',
  'googlebusiness',
] as const

export type Platform = (typeof platformValues)[number]

/** API platform type for a CLI platform name (x/twitter → TWITTER,
 *  googlebusiness → GOOGLE_BUSINESS). */
export function toApiPlatform(platform: string) {
  const upper = platform.toUpperCase()
  const mapped = upper === 'X' ? 'TWITTER' : upper === 'GOOGLEBUSINESS' ? 'GOOGLE_BUSINESS' : upper
  return mapped as
    | 'TIKTOK' | 'YOUTUBE' | 'INSTAGRAM' | 'FACEBOOK' | 'TWITTER' | 'THREADS'
    | 'LINKEDIN' | 'PINTEREST' | 'REDDIT' | 'MASTODON' | 'DISCORD' | 'SLACK'
    | 'BLUESKY' | 'GOOGLE_BUSINESS'
}

export const platforms = {
  schema: z.enum(platformValues),
  commentsSchema: z.enum(commentPlatformValues),
  commentRepliesSchema: z.enum(commentReplyPlatformValues),
  channelSelectSchema: z.enum(channelSelectPlatformValues),
  options: [
    { value: 'x', label: 'X (Twitter)' },
    { value: 'twitter', label: 'X (Twitter)' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'threads', label: 'Threads' },
    { value: 'reddit', label: 'Reddit' },
    { value: 'pinterest', label: 'Pinterest' },
    { value: 'bluesky', label: 'Bluesky' },
    { value: 'googlebusiness', label: 'Google Business Profile' },
    { value: 'mastodon', label: 'Mastodon' },
    { value: 'discord', label: 'Discord' },
    { value: 'slack', label: 'Slack' },
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
