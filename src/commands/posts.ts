import nodeProcess from 'node:process'
import { z } from 'zod'
import { confirm, isCancel } from '@clack/prompts'
import { isAgent } from 'goke'
import { createGroup, platforms } from '../globals.ts'
import { createClient } from '../client.ts'
import { output } from '../output.ts'
import { parseScheduledAt } from '../scheduling.ts'

const posts = createGroup()

posts
  .command(
    'posts create',
    'Create, schedule, or publish a post. Use `--publish-now` or `--scheduled-at`, not both.',
  )
  .example('akarso posts create --text "Hello!" --accounts acc_123 --publish-now')
  .example('akarso posts create --text "Later" --accounts acc_123 --scheduled-at 2h')
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
    '--media-urls [urls]',
    z.string().describe('Comma-separated media URLs'),
  )
  .option(
    '--platform [platform]',
    platforms.schema
      .default('twitter')
      .describe('Default platform for all accounts'),
  )
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })

    const accountIds = options.accounts.split(',').map((s) => s.trim())
    const platformTargets = accountIds.map((accountId) => ({
      platform: options.platform,
      accountId,
    }))

    const mediaItems = options.mediaUrls
      ? options.mediaUrls
          .split(',')
          .map((url) => ({ url: url.trim(), type: 'image' as const }))
      : undefined

    if (options.publishNow && options.scheduledAt) {
      throw new Error('Choose either --publish-now or --scheduled-at, not both.')
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
        mediaItems: mediaItems || undefined,
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
