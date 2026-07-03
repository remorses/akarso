import nodeProcess from 'node:process'
import { z } from 'zod'
import { confirm, isCancel } from '@clack/prompts'
import { isAgent } from 'goke'
import { createGroup, platforms, toApiPlatform, type Platform } from '../globals.ts'
import { createClient } from '../client.ts'
import { output } from '../output.ts'
import { parseScheduledAt } from '../scheduling.ts'
import { resolveMediaToUploadId } from './media.ts'

const POST_STATUSES = [
  'draft', 'scheduled', 'posted', 'error', 'deleted', 'processing', 'review', 'retrying',
] as const

/** Build the create-post request body. Content is per-platform under
 *  `data.<PLATFORM>`; the CLI applies the same text and media to every
 *  selected platform. Pure function so the CLI action and tests share the
 *  rules:
 *  - publish now  → status SCHEDULED with postDate = now
 *  - scheduled-at → status SCHEDULED with the parsed postDate
 *  - neither      → status DRAFT (postDate still required upstream) */
export function buildPostBody(opts: {
  text: string
  title?: string
  platforms: Platform[]
  uploadIds?: string[]
  publishNow?: boolean
  scheduledAt?: string
  now?: Date
}) {
  const now = opts.now ?? new Date()
  const postDate = opts.scheduledAt
    ? parseScheduledAt(opts.scheduledAt, now)
    : now.toISOString()
  const status = opts.publishNow || opts.scheduledAt ? ('SCHEDULED' as const) : ('DRAFT' as const)
  const socialAccountTypes = opts.platforms.map((platform) => toApiPlatform(platform))
  return {
    title: opts.title || opts.text.slice(0, 80) || 'Untitled post',
    postDate,
    status,
    socialAccountTypes,
    data: Object.fromEntries(
      socialAccountTypes.map((type) => [
        type,
        { text: opts.text, ...(opts.uploadIds?.length ? { uploadIds: opts.uploadIds } : {}) },
      ]),
    ),
  }
}

const posts = createGroup()

posts
  .command(
    'posts create',
    'Create, schedule, or publish a post. Use `--publish-now` or `--scheduled-at`; neither saves a draft.',
  )
  .example('akarso posts create --text "Hello!" --platforms twitter --publish-now')
  .example('akarso posts create --text "Later" --platforms twitter,linkedin --scheduled-at 2h')
  .example('akarso posts create --text "Pics" --platforms instagram --media ./photo.jpg,https://example.com/clip.mp4 --publish-now')
  .option('--text <content>', z.string().describe('Post text content, applied to every platform'))
  .option(
    '--platforms <list>',
    z.string().describe(`Comma-separated platforms to publish to (${platforms.schema.options.join(', ')})`),
  )
  .option('--publish-now', 'Publish immediately')
  .option(
    '--scheduled-at [iso]',
    z.string().describe('Schedule time: ISO date, 30m, 2h, 3d, or 1w'),
  )
  .option(
    '--title [title]',
    z.string().describe('Internal post title, shown in the dashboard (defaults to the text)'),
  )
  .option(
    '--media [items]',
    z
      .string()
      .describe(
        'Comma-separated media items: local file paths or `https` URLs. Both are uploaded and attached to every platform (local paths are not available on the hosted MCP server, use URLs there).',
      ),
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

    const selectedPlatforms = options.platforms
      .split(',')
      .map((value) => platforms.schema.parse(value.trim()))

    // Resolve media inputs to upload IDs: local paths are uploaded as raw
    // bytes, https URLs are imported server-side.
    let uploadIds: string[] | undefined
    if (options.media) {
      uploadIds = []
      for (const item of options.media.split(',').map((s) => s.trim()).filter(Boolean)) {
        const uploadId = await resolveMediaToUploadId({
          input: item,
          client,
          apiKey: options.apiKey,
          fs,
          env: process.env,
          log: (message) => console.error(message),
        })
        uploadIds.push(uploadId)
      }
    }

    const body = buildPostBody({
      text: options.text,
      title: options.title || undefined,
      platforms: selectedPlatforms,
      uploadIds,
      publishNow: options.publishNow,
      scheduledAt: options.scheduledAt || undefined,
    })

    const data = await client('/api/v1/posts', { method: 'POST', body })
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
    z.enum(POST_STATUSES).describe('Filter by status'),
  )
  .option(
    '--platforms [list]',
    z.string().describe('Comma-separated platforms to filter by'),
  )
  .option('--search [q]', z.string().describe('Search post titles and content'))
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
        status: options.status
          ? (options.status.toUpperCase() as Uppercase<typeof options.status>)
          : undefined,
        platforms: options.platforms || undefined,
        q: options.search || undefined,
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
    if (data instanceof Error) {
      // 402 Payment Required: retrying publishes content, gated like create
      if (data.status === 402) {
        console.error('Subscription required to retry posts.')
        console.error('Start a 7-day free trial by running:')
        console.error('')
        console.error('  akarso subscribe')
        console.error('')
        process.exit(1)
      }
      throw data
    }
    output(data, { json: options.json, console })
  })

export default posts
