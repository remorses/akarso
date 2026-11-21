// Engagement commands: comments, direct messages, and Google Business
// reviews of the workspace's connected accounts. Accounts are addressed by
// platform name (one per platform per workspace); the server resolves the
// account. Writes (comment, message, review reply) count as one post each
// toward the monthly limit; reads are free except on X.
import nodeProcess from 'node:process'
import { z } from 'zod'
import dedent from 'string-dedent'
import { confirm, isCancel } from '@clack/prompts'
import { isAgent } from 'goke'
import { createGroup, toApiPlatform } from '../globals.ts'
import { createClient } from '../client.ts'
import { exitOnApiError, output } from '../output.ts'

const commentPlatform = z.enum(['x', 'twitter', 'facebook', 'instagram', 'threads', 'linkedin', 'youtube'])
const messagePlatform = z.enum(['x', 'twitter', 'instagram'])

/** Ask before a destructive call unless --force; agents and non-TTY shells must pass --force. */
async function confirmOrExit(options: {
  force?: boolean
  message: string
  console: { error(message: string): void }
  process: { exit(code?: number): void }
}): Promise<boolean> {
  if (options.force) return true
  // goke's injected process exposes stdin as a string, so TTY detection
  // must go through the real node process.
  if (isAgent || !nodeProcess.stdin.isTTY) {
    options.console.error('Use --force to run this non-interactively.')
    options.process.exit(1)
    return false
  }
  const confirmed = await confirm({ message: options.message, initialValue: false })
  return !isCancel(confirmed) && confirmed
}

const engagement = createGroup()

// ── Comments ────────────────────────────────────────────────────────

engagement
  .command(
    'comments list',
    dedent`
      List the comments and first-level replies on a post.

      \`--post-id\` is the post's ID on the platform itself (the tweet ID on X, the video ID on YouTube), shown as \`platformPostId\` in \`posts get\`. Supported: \`facebook\`, \`instagram\`, \`threads\`, \`linkedin\`, \`youtube\`, \`x\`. Page with \`--after\` using the returned \`nextCursor\`.

      On X, replies come from recent search (about the last 7 days) and each call counts as one analytics request. Other platforms are free.
    `,
  )
  .example('akarso comments list --platform instagram --post-id 17895695668004550')
  .option('--platform <platform>', commentPlatform.describe('Platform of the post'))
  .option('--post-id <id>', z.string().describe('Post ID on the platform'))
  .option('--limit [n]', z.number().optional().describe('Page size, 1-100 (default 25)'))
  .option('--after [cursor]', z.string().describe('Cursor from the previous page (`nextCursor`)'))
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({ apiKey: options.apiKey, fs, env: process.env })
    const data = await client('/api/v2/comments', {
      query: {
        platform: toApiPlatform(options.platform),
        postId: options.postId,
        limit: options.limit,
        after: options.after || undefined,
      },
    })
    if (data instanceof Error) exitOnApiError({ error: data, console, process })
    output(data, { json: options.json, console })
  })

engagement
  .command(
    'comments create',
    dedent`
      Post a comment on a post, or reply to a comment.

      Pass \`--post-id\` for a top-level comment (Instagram, Facebook, LinkedIn, YouTube; a top-level post on Threads), or \`--comment-id\` to reply to a comment on any supported platform. On X a comment is a reply tweet: \`--post-id\` is the tweet to reply to.

      **Requires an active subscription.** Counts as one post toward the monthly limit; on X it also counts toward the X cap like a tweet (a link counts as 10).
    `,
  )
  .example('akarso comments create --platform instagram --comment-id 17858893269000001 --text "Thank you!"')
  .example('akarso comments create --platform x --post-id 1790000000000000000 --text "Glad you like it"')
  .option('--platform <platform>', commentPlatform.describe('Platform of the post or comment'))
  .option('--text <text>', z.string().describe('Comment text'))
  .option('--post-id [id]', z.string().describe('Post ID on the platform, for a top-level comment'))
  .option('--comment-id [id]', z.string().describe('Comment ID to reply to'))
  .action(async (options, { fs, console, process }) => {
    if (!options.postId && !options.commentId) {
      throw new Error('Pass --post-id for a top-level comment or --comment-id to reply to a comment.')
    }
    const client = await createClient({ apiKey: options.apiKey, fs, env: process.env })
    const data = await client('/api/v2/comments', {
      method: 'POST',
      body: {
        platform: toApiPlatform(options.platform),
        text: options.text,
        postId: options.postId || undefined,
        commentId: options.commentId || undefined,
      },
    })
    if (data instanceof Error) exitOnApiError({ error: data, console, process })
    output(data, { json: options.json, console })
  })

engagement
  .command(
    'comments delete <commentId>',
    dedent`
      Delete a comment. This cannot be undone.

      Works on Facebook Pages, Instagram business accounts, LinkedIn, YouTube, and X (only your own reply tweets; counts as one analytics request). On YouTube, comments by others on your videos are rejected (removed permanently). Not supported on Threads.

      Pass \`--force\` to skip the confirmation prompt (required for agents and scripts).
    `,
  )
  .option('--platform <platform>', commentPlatform.describe('Platform of the comment'))
  .option('--force', 'Skip confirmation')
  .action(async (commentId, options, { fs, console, process }) => {
    const confirmed = await confirmOrExit({ force: options.force, message: `Delete comment ${commentId}?`, console, process })
    if (!confirmed) return
    const client = await createClient({ apiKey: options.apiKey, fs, env: process.env })
    const data = await client('/api/v2/comments/:commentId', {
      method: 'DELETE',
      params: { commentId },
      query: { platform: toApiPlatform(options.platform) },
    })
    if (data instanceof Error) exitOnApiError({ error: data, console, process })
    output(data, { json: options.json, console })
  })

engagement
  .command(
    'comments hide <commentId>',
    dedent`
      Hide a comment, or unhide it with \`--unhide\`.

      Works on Instagram business posts and on replies to your X posts (counts as one analytics request on X). YouTube has no reversible hide: use \`comments delete\` instead.
    `,
  )
  .option('--platform <platform>', commentPlatform.describe('Platform of the comment'))
  .option('--unhide', 'Make a hidden comment visible again')
  .action(async (commentId, options, { fs, console, process }) => {
    const client = await createClient({ apiKey: options.apiKey, fs, env: process.env })
    const data = await client('/api/v2/comments/:commentId', {
      method: 'PATCH',
      params: { commentId },
      body: { platform: toApiPlatform(options.platform), hidden: !options.unhide },
    })
    if (data instanceof Error) exitOnApiError({ error: data, console, process })
    output(data, { json: options.json, console })
  })

// ── Direct messages ─────────────────────────────────────────────────

engagement
  .command(
    'messages list',
    dedent`
      List the direct message conversations of the connected Instagram or X account.

      Accounts connected before messaging was supported must reconnect (\`accounts connect\`) to grant access. On X each call counts as one analytics request; Instagram is free.
    `,
  )
  .example('akarso messages list --platform instagram')
  .option('--platform <platform>', messagePlatform.describe('Platform of the account'))
  .option('--limit [n]', z.number().optional().describe('Page size, 1-100 (default 20)'))
  .option('--after [cursor]', z.string().describe('Cursor from the previous page (`nextCursor`)'))
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({ apiKey: options.apiKey, fs, env: process.env })
    const data = await client('/api/v2/messages', {
      query: { platform: toApiPlatform(options.platform), limit: options.limit, after: options.after || undefined },
    })
    if (data instanceof Error) exitOnApiError({ error: data, console, process })
    output(data, { json: options.json, console })
  })

engagement
  .command(
    'messages get <conversationId>',
    'List the messages of one conversation. Find conversation IDs with `messages list`. On X each call counts as one analytics request.',
  )
  .option('--platform <platform>', messagePlatform.describe('Platform of the account'))
  .option('--limit [n]', z.number().optional().describe('Page size, 1-100 (default 25)'))
  .option('--after [cursor]', z.string().describe('Cursor from the previous page (`nextCursor`)'))
  .action(async (conversationId, options, { fs, console, process }) => {
    const client = await createClient({ apiKey: options.apiKey, fs, env: process.env })
    const data = await client('/api/v2/messages/:conversationId', {
      params: { conversationId },
      query: { platform: toApiPlatform(options.platform), limit: options.limit, after: options.after || undefined },
    })
    if (data instanceof Error) exitOnApiError({ error: data, console, process })
    output(data, { json: options.json, console })
  })

engagement
  .command(
    'messages send',
    dedent`
      Send a direct message from the connected Instagram or X account.

      \`--to\` is the recipient's user ID on the platform (a participant \`id\` from \`messages list\`). Instagram only allows replies within 24 hours of the recipient's last message; on X the recipient must accept messages from you.

      **Requires an active subscription.** Counts as one post toward the monthly limit, and on X also toward the X cap.
    `,
  )
  .example('akarso messages send --platform instagram --to 17841400000000000 --text "Thanks for reaching out!"')
  .option('--platform <platform>', messagePlatform.describe('Platform of the account'))
  .option('--to <recipientId>', z.string().describe('Recipient user ID on the platform'))
  .option('--text <text>', z.string().describe('Message text'))
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({ apiKey: options.apiKey, fs, env: process.env })
    const data = await client('/api/v2/messages', {
      method: 'POST',
      body: { platform: toApiPlatform(options.platform), recipientId: options.to, text: options.text },
    })
    if (data instanceof Error) exitOnApiError({ error: data, console, process })
    output(data, { json: options.json, console })
  })

// ── Google Business reviews ─────────────────────────────────────────

engagement
  .command(
    'reviews list',
    dedent`
      List the reviews of the connected Google Business Profile, newest first.

      Each review has its rating, reviewer, text, and the current owner reply. Page with \`--after\` using the returned \`nextCursor\`. Free.
    `,
  )
  .option('--limit [n]', z.number().optional().describe('Page size, 1-50 (default 25)'))
  .option('--after [cursor]', z.string().describe('Cursor from the previous page (`nextCursor`)'))
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({ apiKey: options.apiKey, fs, env: process.env })
    const data = await client('/api/v2/reviews', {
      query: { limit: options.limit, after: options.after || undefined },
    })
    if (data instanceof Error) exitOnApiError({ error: data, console, process })
    output(data, { json: options.json, console })
  })

engagement
  .command(
    'reviews reply <reviewId>',
    dedent`
      Publish the owner reply to a Google Business review.

      A review has one owner reply, so replying again replaces it. **Requires an active subscription.** Counts as one post toward the monthly limit.
    `,
  )
  .example('akarso reviews reply AbFvOqm... --text "Thanks for visiting!"')
  .option('--text <text>', z.string().describe('Reply text'))
  .action(async (reviewId, options, { fs, console, process }) => {
    const client = await createClient({ apiKey: options.apiKey, fs, env: process.env })
    const data = await client('/api/v2/reviews/reply', {
      method: 'POST',
      body: { reviewId, text: options.text },
    })
    if (data instanceof Error) exitOnApiError({ error: data, console, process })
    output(data, { json: options.json, console })
  })

engagement
  .command(
    'reviews delete-reply <reviewId>',
    'Delete the owner reply from a Google Business review. Pass `--force` to skip the confirmation prompt. Free.',
  )
  .option('--force', 'Skip confirmation')
  .action(async (reviewId, options, { fs, console, process }) => {
    const confirmed = await confirmOrExit({ force: options.force, message: `Delete the reply on review ${reviewId}?`, console, process })
    if (!confirmed) return
    const client = await createClient({ apiKey: options.apiKey, fs, env: process.env })
    const data = await client('/api/v2/reviews/:reviewId/reply', {
      method: 'DELETE',
      params: { reviewId },
      query: {},
    })
    if (data instanceof Error) exitOnApiError({ error: data, console, process })
    output(data, { json: options.json, console })
  })

export default engagement
