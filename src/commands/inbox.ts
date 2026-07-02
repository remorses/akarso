import { z } from 'zod'
import { createGroup, platforms } from '../globals.ts'
import { createClient } from '../client.ts'
import { output } from '../output.ts'

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
  .option(
    '--account-id <id>',
    z.string().describe('Account ID to send from'),
  )
  .option(
    '--message <text>',
    z.string().describe('Message text'),
  )
  .action(async (conversationId, options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/inbox/conversations/:conversationId/messages', {
      method: 'POST',
      params: { conversationId },
      body: {
        accountId: options.accountId,
        message: options.message,
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
