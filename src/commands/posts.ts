import nodeProcess from 'node:process'
import { z } from 'zod'
import dedent from 'string-dedent'
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
 *  - neither      → status DRAFT (postDate still required by the API) */
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
    dedent`
      Create a social media post as a draft, publish it immediately, or schedule it for later.

      **Three modes:**
      - No flag: saves as a **draft** (visible in dashboard, not published)
      - \`--publish-now\`: publishes immediately to all selected platforms
      - \`--scheduled-at\`: schedules for a future time (accepts ISO dates like \`2026-03-15T14:00:00Z\`, or relative values: \`30m\`, \`2h\`, \`3d\`, \`1w\`)

      The same text and media are applied to every selected platform. Platforms are specified as a comma-separated list (e.g. \`--platforms x,linkedin,instagram\`). Run \`accounts list\` to see which platforms are connected in the current profile.

      **Media:** attach images or videos with \`--media\`. Accepts local file paths and \`https\` URLs, comma-separated. Files are uploaded first; the returned upload IDs are attached to the post. Supported formats: jpg, png, webp, gif, mp4, mov, avi, webm, pdf.

      **Requires an active subscription.** Returns 402 if no subscription exists. Run \`akarso subscribe\` to start a free trial. Returns 403 if the org has hit its plan's monthly post limit or channel limit.
    `,
  )
  .example('akarso posts create --text "Hello!" --platforms x --publish-now')
  .example('akarso posts create --text "Later" --platforms x,linkedin --scheduled-at 2h')
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
  .command(
    'posts list',
    dedent`
      List posts in the current workspace, with optional filters.

      Returns posts sorted by creation date (newest first). Each post includes its status, title, platforms, and scheduled/published date.

      **Statuses:** \`draft\`, \`scheduled\`, \`posted\`, \`error\`, \`deleted\`, \`processing\`, \`review\`, \`retrying\`. Filter with \`--status\`.

      Use \`--platforms\` to filter by target platform(s), \`--search\` to search post titles and content, and \`--limit\` to control how many results are returned (default: 10).
    `,
  )
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
  .command(
    'posts get <postId>',
    dedent`
      Get full details for a single post by its ID.

      Returns the post's content, status, per-platform publishing results (including published URLs and platform-specific errors), scheduled date, and attached media. Use this to check whether a published post succeeded on all target platforms or to retrieve the live URLs.
    `,
  )
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
  .command(
    'posts delete <postId>',
    dedent`
      Delete a post by its ID. This action cannot be undone.

      Pass \`--force\` to skip the confirmation prompt (required when called programmatically or by agents).

      Deleting a post removes it from the dashboard. If the post was already published, it may or may not be removed from the social platforms depending on platform support.
    `,
  )
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
  .command(
    'posts retry <postId>',
    dedent`
      Retry publishing a post that previously failed.

      Only works on posts with \`error\` status. Re-submits the post for publishing with the original content and target platforms. Check the result with \`posts get <postId>\`.

      **Requires an active subscription** (same as \`posts create\`). Returns 402 without one.
    `,
  )
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
