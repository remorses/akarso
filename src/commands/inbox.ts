// Inbox commands: comments and reviews on published posts.
// Comments work as async imports: `inbox sync <postId>` starts an import,
// `inbox syncs` shows its status, `inbox comments` reads the imported
// comments, `inbox reply` publishes replies, and `inbox comment-action`
// moderates. Reviews (Google Business) follow the same sync-then-read flow.
import { z } from 'zod'
import { createGroup, platforms, toApiPlatform } from '../globals.ts'
import { createClient } from '../client.ts'
import { output } from '../output.ts'

const inbox = createGroup()

inbox
  .command('inbox sync <postId>', 'Import the comments on a published post')
  .example('akarso inbox sync post_123 --platform x')
  .option(
    '--platform <platform>',
    platforms.commentsSchema.describe('Platform to import comments from'),
  )
  .action(async (postId, options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/inbox/comments/sync', {
      method: 'POST',
      body: {
        postId,
        platform: toApiPlatform(options.platform) as 'FACEBOOK',
      },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

inbox
  .command('inbox syncs', 'List comment import jobs and their status')
  .option('--post-id [id]', z.string().describe('Filter by post ID'))
  .option('--limit [n]', z.number().default(20).describe('Maximum imports to return'))
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/inbox/comments/sync', {
      query: {
        postId: options.postId || undefined,
        limit: options.limit,
      },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

inbox
  .command('inbox comments', 'List imported comments (run `inbox sync` first)')
  .option('--post-id [id]', z.string().describe('Filter by post ID'))
  .option(
    '--platform [platform]',
    platforms.commentsSchema.describe('Filter by platform'),
  )
  .option('--limit [n]', z.number().default(20).describe('Maximum comments to return'))
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/inbox/comments', {
      query: {
        postId: options.postId || undefined,
        platform: options.platform ? (toApiPlatform(options.platform) as 'FACEBOOK') : undefined,
        limit: options.limit,
      },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

inbox
  .command('inbox reply <postId>', 'Publish a reply in a post comment section')
  .example('akarso inbox reply post_123 --platform x --text "Thanks!"')
  .example('akarso inbox reply post_123 --platform youtube --text "Fixed" --comment-id cmt_456')
  .option(
    '--platform <platform>',
    platforms.commentRepliesSchema.describe('Platform to reply on'),
  )
  .option('--text <text>', z.string().describe('Reply text'))
  .option(
    '--comment-id [id]',
    z.string().describe('Imported comment ID to reply to (omit to comment on the post itself)'),
  )
  .action(async (postId, options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/inbox/reply', {
      method: 'POST',
      body: {
        postId,
        platform: toApiPlatform(options.platform) as 'FACEBOOK',
        text: options.text,
        parentCommentId: options.commentId || undefined,
      },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

inbox
  .command('inbox comment-action <commentId>', 'Moderate an imported comment')
  .example('akarso inbox comment-action cmt_123 --action HIDE')
  .option(
    '--action <action>',
    z
      .enum(['DELETE', 'HIDE', 'UNHIDE', 'LIKE', 'UNLIKE', 'APPROVE', 'REJECT'])
      .describe('Moderation action to run'),
  )
  .option('--reason [reason]', z.string().describe('Optional reason for the action'))
  .option('--ban-author', 'Also ban the comment author where the platform supports it')
  .action(async (commentId, options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/inbox/comments/:commentId/action', {
      method: 'POST',
      params: { commentId },
      body: {
        action: options.action,
        reason: options.reason || undefined,
        banAuthor: options.banAuthor || undefined,
      },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

inbox
  .command('inbox reviews', 'List imported Google Business reviews (run `inbox reviews-sync` first)')
  .option('--limit [n]', z.number().default(20).describe('Maximum reviews to return'))
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/inbox/reviews', {
      query: { limit: options.limit },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

inbox
  .command('inbox reviews-sync', 'Import your Google Business location reviews')
  .option('--count [n]', z.number().default(50).describe('Number of most recent reviews to import'))
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/inbox/reviews/sync', {
      method: 'POST',
      body: { count: options.count },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

inbox
  .command('inbox review-reply <reviewId>', 'Reply to a Google Business review as the owner')
  .option('--text <text>', z.string().describe('Reply text'))
  .action(async (reviewId, options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/inbox/reviews/:reviewId/reply', {
      method: 'POST',
      params: { reviewId },
      body: { text: options.text },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

export default inbox
