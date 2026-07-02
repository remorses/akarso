import nodeProcess from 'node:process'
import { z } from 'zod'
import dedent from 'string-dedent'
import { confirm, isCancel } from '@clack/prompts'
import { isAgent } from 'goke'
import { createGroup, platforms } from '../globals.ts'
import { createClient } from '../client.ts'
import { output } from '../output.ts'
import { parseScheduledAt } from '../scheduling.ts'
import { resolveMediaInput } from './media.ts'

/** Platforms that support native drafts via platformSpecificData.draft. */
const PLATFORM_DRAFT_PLATFORMS = new Set(['facebook', 'tiktok'])

export interface PlatformTarget {
  platform: string
  accountId: string
  platformSpecificData?: { draft: true }
}

/** Build the per-account platform targets for post creation. When
 *  platformDraft is set, each target gets platformSpecificData.draft so the
 *  post lands as a native platform draft (Facebook Publishing Tools /
 *  TikTok Creator Inbox) instead of going live. Pure function, validated
 *  here so both the CLI action and tests share the rules. */
export function buildPlatformTargets(opts: {
  accountIds: string[]
  platform: string
  platformDraft?: boolean
}): PlatformTarget[] | Error {
  if (opts.platformDraft && !PLATFORM_DRAFT_PLATFORMS.has(opts.platform)) {
    return new Error(dedent`
      Native platform drafts are only supported on facebook and tiktok, not "${opts.platform}".
      For other platforms, save a regular draft instead: omit --publish-now and --scheduled-at.
    `)
  }
  return opts.accountIds.map((accountId) => ({
    platform: opts.platform,
    accountId,
    ...(opts.platformDraft ? { platformSpecificData: { draft: true as const } } : {}),
  }))
}

const posts = createGroup()

posts
  .command(
    'posts create',
    'Create, schedule, or publish a post. Use `--publish-now` or `--scheduled-at`, not both.',
  )
  .example('akarso posts create --text "Hello!" --accounts acc_123 --publish-now')
  .example('akarso posts create --text "Later" --accounts acc_123 --scheduled-at 2h')
  .example('akarso posts create --text "Pics" --accounts acc_123 --media ./photo.jpg,https://example.com/clip.mp4')
  .example('akarso posts create --text "Review me" --accounts acc_fb --platform facebook --publish-now --platform-draft')
  .option('--text <content>', z.string().describe('Post text content'))
  .option(
    '--accounts <ids>',
    z.string().describe('Comma-separated account IDs'),
  )
  .option('--publish-now', 'Publish immediately')
  .option(
    '--scheduled-at [iso]',
    z.string().describe('Schedule time: ISO date, 30m, 2h, 3d, or 1w'),
  )
  .option(
    '--title [title]',
    z.string().describe('Post title (required for YouTube)'),
  )
  .option(
    '--media [items]',
    z
      .string()
      .describe(
        'Comma-separated media items: local file paths or `https` URLs. Paths are uploaded automatically (not available on the hosted MCP server, use URLs there).',
      ),
  )
  .option(
    '--platform [platform]',
    platforms.schema
      .default('twitter')
      .describe('Default platform for all accounts'),
  )
  .option(
    '--platform-draft',
    'Create a native draft on the platform instead of publishing. Only Facebook and TikTok support this. Facebook: unpublished draft in Publishing Tools (feed posts and reels only, not stories; expires after ~30 days). TikTok: sends to the Creator Inbox, where the creator gets a notification and finishes the post in TikTok\'s editing flow (requires the video.upload scope and TikTok app 31.8+). Requires `--publish-now` or `--scheduled-at`.',
  )
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })

    if (options.publishNow && options.scheduledAt) {
      throw new Error('Choose either --publish-now or --scheduled-at, not both.')
    }
    if (options.platformDraft && !options.publishNow && !options.scheduledAt) {
      // A platform draft is still *sent* to the platform; without a timing
      // flag the post would become a Zernio-side draft and the platform
      // draft data would sit unused.
      throw new Error(
        'A platform draft is still sent to the platform, so `--platform-draft` requires `--publish-now` or `--scheduled-at`.',
      )
    }

    const accountIds = options.accounts.split(',').map((s) => s.trim())
    const platformTargets = buildPlatformTargets({
      accountIds,
      platform: options.platform,
      platformDraft: options.platformDraft,
    })
    if (platformTargets instanceof Error) throw platformTargets

    // Resolve media inputs: https URLs pass through, local paths get
    // uploaded first. Media type (image/video/gif/document) is inferred
    // from the file extension.
    let mediaItems: { url: string; type: 'image' | 'video' | 'gif' | 'document' }[] | undefined
    if (options.media) {
      mediaItems = []
      for (const item of options.media.split(',').map((s) => s.trim()).filter(Boolean)) {
        const resolved = await resolveMediaInput({
          input: item,
          client,
          fs,
          env: process.env,
          log: (message) => console.error(message),
        })
        mediaItems.push({ url: resolved.url, type: resolved.mediaKind })
      }
    }

    const scheduledFor = options.scheduledAt
      ? parseScheduledAt(options.scheduledAt)
      : undefined

    const data = await client('/api/v1/posts', {
      method: 'POST',
      body: {
        content: options.text,
        title: options.title || undefined,
        platforms: platformTargets,
        publishNow: options.publishNow || false,
        scheduledFor,
        mediaItems: mediaItems?.length ? mediaItems : undefined,
      },
    })
    if (data instanceof Error) {
      // SpiceflowFetchError carries the typed HTTP status and parsed error body
      // 402 Payment Required: subscription needed
      if (data.status === 402) {
        console.error('Subscription required to create posts.')
        console.error('Start a 7-day free trial by running:')
        console.error('')
        console.error('  akarso subscribe')
        console.error('')
        process.exit(1)
      }
      // 403 with plan limit errors: show upgrade message
      if (data.status === 403) {
        console.error(data.value.error || data.message)
        process.exit(1)
      }
      throw data
    }
    output(data, { json: options.json, console })
  })

posts
  .command('posts list', 'List posts')
  .option(
    '--status [status]',
    z
      .enum(['draft', 'scheduled', 'published', 'failed'])
      .describe('Filter by status'),
  )
  .option(
    '--limit [n]',
    z.number().default(10).describe('Maximum number of posts to return'),
  )
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/posts', {
      query: {
        status: options.status || undefined,
        limit: options.limit,
      },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

posts
  .command('posts get <postId>', 'Get post details')
  .action(async (postId, options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/posts/:postId', {
      params: { postId },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

posts
  .command('posts delete <postId>', 'Delete a post (skip confirmation with `--force`)')
  .option('--force', 'Skip confirmation')
  .action(async (postId, options, { fs, console, process }) => {
    if (!options.force) {
      // goke's injected process exposes stdin as a string, so TTY detection
      // must go through the real node process.
      if (isAgent || !nodeProcess.stdin.isTTY) {
        console.error('Use --force to delete non-interactively.')
        process.exit(1)
      }
      const confirmed = await confirm({
        message: `Delete post ${postId}? This cannot be undone.`,
        initialValue: false,
      })
      if (isCancel(confirmed) || !confirmed) {
        return
      }
    }
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/posts/:postId', {
      method: 'DELETE',
      params: { postId },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

posts
  .command('posts retry <postId>', 'Retry a failed post')
  .action(async (postId, options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/posts/:postId/retry', {
      method: 'POST',
      params: { postId },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

export default posts
