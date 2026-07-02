import { goke } from 'goke'
import { z } from 'zod'

const platformValues = [
  'facebook',
  'instagram',
  'linkedin',
  'twitter',
  'tiktok',
  'youtube',
  'threads',
  'reddit',
  'pinterest',
  'bluesky',
  'googlebusiness',
  'telegram',
  'snapchat',
  'discord',
] as const

const inboxConversationPlatformValues = [
  'facebook',
  'instagram',
  'twitter',
  'bluesky',
  'reddit',
  'telegram',
] as const

const inboxCommentPlatformValues = [
  'facebook',
  'instagram',
  'twitter',
  'bluesky',
  'threads',
  'youtube',
  'linkedin',
  'reddit',
] as const

const inboxReviewPlatformValues = ['facebook', 'googlebusiness'] as const

export type Platform = (typeof platformValues)[number]

export const platforms = {
  schema: z.enum(platformValues),
  inboxConversationsSchema: z.enum(inboxConversationPlatformValues),
  inboxCommentsSchema: z.enum(inboxCommentPlatformValues),
  inboxReviewsSchema: z.enum(inboxReviewPlatformValues),
  options: [
    { value: 'twitter', label: 'Twitter / X' },
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
    { value: 'telegram', label: 'Telegram' },
    { value: 'snapchat', label: 'Snapchat' },
    { value: 'discord', label: 'Discord' },
  ] satisfies Array<{ value: Platform; label: string }>,
}

/** Create a goke instance with the shared global options (--api-key, --json) */
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
    .option('--json', 'Output raw JSON instead of YAML')
}
