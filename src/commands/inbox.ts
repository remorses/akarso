import { z } from 'zod'
import { createGroup, platforms } from '../globals.ts'
import { createClient } from '../client.ts'
import { output } from '../output.ts'
import { resolveMediaInput } from './media.ts'

const inbox = createGroup()

inbox
  .command('inbox conversations', 'List DM conversations')
  .option(
    '--platform [platform]',
    platforms.inboxConversationsSchema.describe('Filter by platform'),
  )
  .option(
    '--account-id <id>',
    z.string().describe('Account ID to list conversations for'),
  )
  .option(
    '--limit [n]',
    z.number().default(20).describe('Maximum conversations to return'),
  )
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/inbox/conversations', {
      query: {
        platform: options.platform || undefined,
        accountId: options.accountId,
        limit: options.limit,
      },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

inbox
  .command('inbox messages <conversationId>', 'Get messages in a conversation')
  .option(
    '--account-id <id>',
    z.string().describe('Account ID for the conversation'),
  )
  .action(async (conversationId, options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/inbox/conversations/:conversationId/messages', {
      params: { conversationId },
      query: { accountId: options.accountId },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

inbox
  .command('inbox send <conversationId>', 'Send a DM')
  .example('akarso inbox send conv_123 --account-id acc_123 --message "Hi!"')
  .example('akarso inbox send conv_123 --account-id acc_123 --attachment ./photo.jpg')
  .option(
    '--account-id <id>',
    z.string().describe('Account ID to send from'),
  )
  .option(
    '--message [text]',
    z.string().describe('Message text (optional when sending an attachment)'),
  )
  .option(
    '--attachment [fileOrUrl]',
    z
      .string()
      .describe(
        'Attachment: local file path or `https` URL. Paths are uploaded automatically (not available on the hosted MCP server, use URLs there).',
      ),
  )
  .option(
    '--attachment-type [type]',
    z
      .enum(['image', 'video', 'audio', 'file'])
      .describe('Attachment type (inferred from the file extension by default)'),
  )
  .action(async (conversationId, options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })

    let attachmentUrl: string | undefined
    let attachmentType = options.attachmentType
    if (options.attachment) {
      const resolved = await resolveMediaInput({
        input: options.attachment,
        client,
        fs,
        env: process.env,
        log: (message) => console.error(message),
      })
      attachmentUrl = resolved.url
      // DM attachments use image|video|audio|file; map post media kinds.
      attachmentType ??= (
        { image: 'image', gif: 'image', video: 'video', document: 'file' } as const
      )[resolved.mediaKind]
    }

    const data = await client('/api/v1/inbox/conversations/:conversationId/messages', {
      method: 'POST',
      params: { conversationId },
      body: {
        accountId: options.accountId,
        message: options.message,
        attachmentUrl,
        attachmentType,
      },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

inbox
  .command('inbox comments', 'List post comments across accounts')
  .option(
    '--platform [platform]',
    platforms.inboxCommentsSchema.describe('Filter by platform'),
  )
  .option(
    '--account-id <id>',
    z.string().describe('Account ID to list comments for'),
  )
  .option(
    '--limit [n]',
    z.number().default(20).describe('Maximum comments to return'),
  )
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/inbox/comments', {
      query: {
        platform: options.platform || undefined,
        accountId: options.accountId,
        limit: options.limit,
      },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

inbox
  .command('inbox reply <postId>', 'Reply to a comment on a post')
  .option(
    '--account-id <id>',
    z.string().describe('Account ID to reply from'),
  )
  .option(
    '--message <text>',
    z.string().describe('Reply text'),
  )
  .option(
    '--comment-id [id]',
    z.string().describe('Specific comment ID to reply to'),
  )
  .action(async (postId, options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/inbox/comments/:postId', {
      method: 'POST',
      params: { postId },
      body: {
        accountId: options.accountId,
        message: options.message,
        commentId: options.commentId || undefined,
      },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

inbox
  .command('inbox reviews', 'List reviews (Facebook, Google Business)')
  .option(
    '--platform [platform]',
    platforms.inboxReviewsSchema.describe('Filter by platform'),
  )
  .option(
    '--account-id <id>',
    z.string().describe('Account ID to list reviews for'),
  )
  .option(
    '--limit [n]',
    z.number().default(20).describe('Maximum reviews to return'),
  )
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/inbox/reviews', {
      query: {
        platform: options.platform || undefined,
        accountId: options.accountId,
        limit: options.limit,
      },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

inbox
  .command('inbox review-reply <reviewId>', 'Reply to a review')
  .option(
    '--account-id <id>',
    z.string().describe('Account ID to reply from'),
  )
  .option(
    '--message <text>',
    z.string().describe('Reply text'),
  )
  .action(async (reviewId, options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/inbox/reviews/:reviewId/reply', {
      method: 'POST',
      params: { reviewId },
      body: {
        accountId: options.accountId,
        message: options.message,
      },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

export default inbox
