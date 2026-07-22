// Post commands: create (publish now / schedule / draft), list, get,
// delete, reschedule, cancel — plus the draft commands (drafts are stored
// by Akarso and published later). Posts target platforms by name; the CLI
// resolves each platform to the workspace's connected account.
import nodeProcess from 'node:process'
import { z } from 'zod'
import dedent from 'string-dedent'
import { confirm, isCancel } from '@clack/prompts'
import { isAgent } from 'goke'
import { createGroup, platforms, toApiPlatform } from '../globals.ts'
import { createClient, type AkarsoClient } from '../client.ts'
import { output } from '../output.ts'
import { parseScheduledAt } from '../scheduling.ts'
import { resolveMediaItems, type MediaItem } from './media.ts'
// Type-only import of the server request schema so post targets carry the
// exact discriminated per-platform types end-to-end (same source the
// typed fetch client uses).
import type { CreatePostRequest } from 'akarso-website/src/lib/api-schemas.ts'

const POST_STATUSES = [
  'draft', 'pending', 'scheduled', 'publishing', 'published', 'failed', 'partial',
] as const

type ApiPlatform = ReturnType<typeof toApiPlatform>

/** One post target, typed by the server schema (discriminated union of
 *  platform + accountId + per-platform options). */
type PostTarget = z.input<typeof CreatePostRequest>['platforms'][number]

/** Build the create-post request body. The same text and media apply to
 *  every target. Pure function so the CLI action and tests share the
 *  rules:
 *  - publish now  → publishNow: true
 *  - scheduled-at → scheduledFor with the parsed ISO time */
export function buildPostBody(opts: {
  text: string
  targets: PostTarget[]
  mediaItems?: MediaItem[]
  scheduledAt?: string
  now?: Date
}) {
  const now = opts.now ?? new Date()
  return {
    content: opts.text,
    ...(opts.mediaItems?.length ? { mediaItems: opts.mediaItems } : {}),
    platforms: opts.targets,
    ...(opts.scheduledAt
      ? { scheduledFor: parseScheduledAt(opts.scheduledAt, now) }
      : { publishNow: true as const }),
  }
}

/** Parse a comma-separated --platforms value into unique API platform
 *  names (x and twitter collapse into one). */
export function parsePlatformsList(value: string): ApiPlatform[] {
  const parsed = value
    .split(',')
    .map((entry) => platforms.schema.parse(entry.trim()))
    .map((entry) => toApiPlatform(entry))
  return [...new Set(parsed)]
}

/** Resolve platform names to the workspace's connected accounts. Errors
 *  with a connect hint when a platform has no account. */
async function resolveTargets(opts: {
  client: AkarsoClient
  platforms: ApiPlatform[]
  pinterestBoard?: string
}): Promise<PostTarget[]> {
  const accounts = await opts.client('/api/v2/accounts')
  if (accounts instanceof Error) throw accounts
  return opts.platforms.map((platform) => {
    const account = accounts.accounts.find((entry) => entry.platform === platform)
    if (!account) {
      throw new Error(
        `No ${platform} account connected. Run \`akarso accounts connect ${platform}\`.`,
      )
    }
    if (platform === 'pinterest') {
      if (!opts.pinterestBoard) {
        throw new Error(
          'Pinterest requires a board. Pass --pinterest-board <boardId> (list boards with `akarso accounts pinterest-boards`).',
        )
      }
      return {
        platform,
        accountId: account.id,
        platformSpecificData: { boardId: opts.pinterestBoard },
      }
    }
    // `platform` is the full union here, so the object literal is not
    // distributively narrowed to one union member — the cast re-attaches
    // the discriminated type (platform is a valid member by construction).
    return { platform, accountId: account.id } as PostTarget
  })
}

function exitOnBillingError(
  error: Error & { status?: number | string; value?: { error?: string } },
  console: { error(message: string): void },
  process: { exit(code?: number): void },
) {
  // SpiceflowFetchError carries the typed HTTP status and parsed error body
  // 402 Payment Required: subscription needed
  if (Number(error.status) === 402) {
    console.error('Subscription required to publish posts.')
    console.error('Start a 7-day free trial by running:')
    console.error('')
    console.error('  akarso subscribe')
    console.error('')
    process.exit(1)
  }
  // 403 with plan limit errors: show upgrade message
  if (Number(error.status) === 403) {
    console.error(error.value?.error || error.message)
    process.exit(1)
  }
  throw error
}

const posts = createGroup()

posts
  .command(
    'posts create',
    dedent`
      Create a social media post as a draft, publish it immediately, or schedule it for later.

      **Three modes:**
      - No flag: saves as a **draft** (stored by Akarso, publish later with \`drafts publish\`)
      - \`--publish-now\`: publishes immediately to all selected platforms
      - \`--scheduled-at\`: schedules for a future time (accepts ISO dates like \`2026-03-15T14:00:00Z\`, or relative values: \`30m\`, \`2h\`, \`3d\`, \`1w\`)

      The same text and media are applied to every selected platform. Platforms are specified as a comma-separated list (e.g. \`--platforms x,linkedin,instagram\`). Run \`accounts list\` to see which platforms are connected in the current profile.

      **Media:** attach images or videos with \`--media\`. Accepts local file paths and \`https\` URLs, comma-separated. URLs are referenced directly; local files are uploaded first. Supported formats: jpg, png, webp, gif, mp4, mov.

      **Pinterest:** requires \`--pinterest-board <boardId>\`. List board IDs with \`accounts pinterest-boards\`.

      **Publishing requires an active subscription.** Returns 402 if no subscription exists (run \`akarso subscribe\` to start a free trial) and 403 if the org has hit its plan's monthly post limit or account limit. Drafts are free.
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
    '--scheduled-at <iso>',
    z.string().optional().describe('Schedule time: ISO date, 30m, 2h, 3d, or 1w'),
  )
  .option(
    '--media [items]',
    z
      .string()
      .describe(
        'Comma-separated media items: local file paths or `https` URLs. URLs are referenced directly; local files are uploaded (not available on the hosted MCP server, use URLs there).',
      ),
  )
  .option(
    '--pinterest-board [id]',
    z.string().describe('Pinterest board ID to pin to (required when posting to pinterest)'),
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

    const selectedPlatforms = parsePlatformsList(options.platforms)

    // Resolve media inputs: https URLs pass through, local files upload
    // via presigned URLs.
    let mediaItems: MediaItem[] | undefined
    if (options.media) {
      mediaItems = await resolveMediaItems({
        inputs: options.media,
        client,
        fs,
        env: process.env,
        log: (message) => console.error(message),
      })
    }

    // No timing flag → save a draft (stored by Akarso, free, no account
    // resolution needed: accounts resolve at publish time).
    if (!options.publishNow && !options.scheduledAt) {
      const draft = await client('/api/v2/drafts', {
        method: 'POST',
        body: {
          content: options.text,
          ...(mediaItems?.length ? { mediaItems } : {}),
          platforms: selectedPlatforms.map((platform) => ({
            platform,
            ...(platform === 'pinterest' && options.pinterestBoard
              ? { platformSpecificData: { boardId: options.pinterestBoard } }
              : {}),
          })),
        },
      })
      if (draft instanceof Error) throw draft
      console.error(`Draft saved. Publish it with: akarso drafts publish ${draft.id}`)
      output(draft, { json: options.json, console })
      return
    }

    const targets = await resolveTargets({
      client,
      platforms: selectedPlatforms,
      pinterestBoard: options.pinterestBoard || undefined,
    })
    const body = buildPostBody({
      text: options.text,
      targets,
      mediaItems,
      scheduledAt: options.scheduledAt || undefined,
    })

    const data = await client('/api/v2/posts', { method: 'POST', body })
    if (data instanceof Error) {
      exitOnBillingError(data, console, process)
      return
    }
    output(data, { json: options.json, console })
  })

posts
  .command(
    'posts list',
    dedent`
      List posts in the current workspace, with optional filters.

      Returns posts sorted by creation date (newest first). Each post includes its status, content, per-platform results, and scheduled/published date. Drafts saved with \`posts create\` (no timing flag) live under \`drafts list\` instead.

      **Statuses:** \`draft\`, \`pending\`, \`scheduled\`, \`publishing\`, \`published\`, \`failed\`, \`partial\`. Filter with \`--status\`.

      Use \`--created-after\`/\`--created-before\` and \`--scheduled-after\`/\`--scheduled-before\` for date range filtering, \`--platforms\` to filter by target platform(s), and \`--limit\` to control how many results are returned (default: 10).
    `,
  )
  .example('akarso posts list --status scheduled')
  .example('akarso posts list --scheduled-after 2026-07-01T00:00:00Z --scheduled-before 2026-08-01T00:00:00Z')
  .option(
    '--status [status]',
    z.enum(POST_STATUSES).describe('Filter by status'),
  )
  .option(
    '--created-after [date]',
    z.string().describe('Only posts created after this ISO date'),
  )
  .option(
    '--created-before [date]',
    z.string().describe('Only posts created before this ISO date'),
  )
  .option(
    '--scheduled-after [date]',
    z.string().describe('Only posts scheduled after this ISO date'),
  )
  .option(
    '--scheduled-before [date]',
    z.string().describe('Only posts scheduled before this ISO date'),
  )
  .option(
    '--platforms [list]',
    z.string().describe('Comma-separated platforms to filter by'),
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

    const data = await client('/api/v2/posts', {
      query: {
        status: options.status || undefined,
        platforms: options.platforms || undefined,
        createdAfter: options.createdAfter || undefined,
        createdBefore: options.createdBefore || undefined,
        scheduledAfter: options.scheduledAfter || undefined,
        scheduledBefore: options.scheduledBefore || undefined,
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

      Returns the post's content, status, per-platform publishing results (including published URLs and platform-specific errors), scheduled date, and attached media. Use this to check whether a published post succeeded on all target platforms, to retrieve the live URLs, or to poll while a post is still \`pending\` or \`publishing\`.
    `,
  )
  .action(async (postId, options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v2/posts/:postId', {
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

      Pass \`--delete-from-platforms\` to also remove the published post from the social platforms themselves (where supported).
    `,
  )
  .option('--force', 'Skip confirmation')
  .option('--delete-from-platforms', 'Also delete the published post from the platforms')
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
    const data = await client('/api/v2/posts/:postId', {
      method: 'DELETE',
      params: { postId },
      query: {
        deleteFromPlatforms: options.deleteFromPlatforms || undefined,
      },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

posts
  .command(
    'posts reschedule <postId>',
    dedent`
      Move a scheduled post to a new publish time.

      Only works on posts with \`scheduled\` status. Accepts ISO dates like \`2026-03-15T14:00:00Z\` or relative values: \`30m\`, \`2h\`, \`3d\`, \`1w\`.
    `,
  )
  .example('akarso posts reschedule 665f1a2b3c --scheduled-at 2h')
  .option(
    '--scheduled-at <iso>',
    z.string().describe('New schedule time: ISO date, 30m, 2h, 3d, or 1w'),
  )
  .action(async (postId, options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v2/posts/scheduled/:postId', {
      method: 'PATCH',
      params: { postId },
      body: { scheduledFor: parseScheduledAt(options.scheduledAt, new Date()) },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

posts
  .command(
    'posts cancel <postId>',
    dedent`
      Cancel a scheduled post before it publishes.

      Only works on posts with \`scheduled\` status. The post is kept with \`draft\` status and can be inspected with \`posts get\` or removed with \`posts delete\`.
    `,
  )
  .action(async (postId, options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v2/posts/scheduled/:postId', {
      method: 'DELETE',
      params: { postId },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

// ── Drafts ──────────────────────────────────────────────────────────
// Drafts are stored by Akarso (create them with `posts create` without a
// timing flag). They are free — no subscription, no quota — until
// published.

posts
  .command(
    'drafts list',
    dedent`
      List the drafts of the current workspace, newest first.

      Drafts are created with \`posts create\` without \`--publish-now\` or \`--scheduled-at\`. Publish one with \`drafts publish <draftId>\`.
    `,
  )
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v2/drafts')
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

posts
  .command(
    'drafts get <draftId>',
    'Get full details for a single draft by its ID.',
  )
  .action(async (draftId, options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v2/drafts/:draftId', {
      params: { draftId },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

posts
  .command(
    'drafts delete <draftId>',
    'Delete a draft by its ID. This action cannot be undone.',
  )
  .action(async (draftId, options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v2/drafts/:draftId', {
      method: 'DELETE',
      params: { draftId },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

posts
  .command(
    'drafts publish <draftId>',
    dedent`
      Publish a draft immediately, or schedule it with \`--scheduled-at\`.

      Platform targets without a pinned account resolve to the workspace's connected account per platform. On success the draft is deleted and the created post is returned.

      **Requires an active subscription** (same as \`posts create --publish-now\`). Returns 402 without one.
    `,
  )
  .example('akarso drafts publish 01JC3A --scheduled-at 2h')
  .option(
    '--scheduled-at <iso>',
    z.string().optional().describe('Schedule time: ISO date, 30m, 2h, 3d, or 1w. Omit to publish now.'),
  )
  .action(async (draftId, options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v2/drafts/:draftId/publish', {
      method: 'POST',
      params: { draftId },
      body: options.scheduledAt
        ? { scheduledFor: parseScheduledAt(options.scheduledAt, new Date()) }
        : { publishNow: true },
    })
    if (data instanceof Error) {
      exitOnBillingError(data, console, process)
      return
    }
    output(data, { json: options.json, console })
  })

export default posts
