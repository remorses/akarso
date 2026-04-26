import { z } from 'zod'
import { createGroup } from '../globals.ts'
import { createClient } from '../zernio.ts'
import { output } from '../output.ts'

const inbox = createGroup()

inbox
  .command('inbox conversations', 'List DM conversations')
  .option(
    '--platform [platform]',
    z.string().describe('Filter by platform (instagram, facebook, twitter, etc.)'),
  )
  .option(
    '--account-id [id]',
    z.string().describe('Filter by account ID'),
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
    const result = await client.messages.listInboxConversations({
      query: {
        platform: (options.platform as any) || undefined,
        accountId: options.accountId || undefined,
        limit: options.limit,
      },
    })
    output(result, { json: options.json, console })
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
    const result = await client.messages.getInboxConversationMessages({
      path: { conversationId },
      query: { accountId: options.accountId },
    })
    output(result, { json: options.json, console })
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
    const result = await client.messages.sendInboxMessage({
      path: { conversationId },
      body: {
        accountId: options.accountId,
        message: options.message,
      },
    })
    output(result, { json: options.json, console })
  })

inbox
  .command('inbox comments', 'List post comments across accounts')
  .option(
    '--platform [platform]',
    z.string().describe('Filter by platform'),
  )
  .option(
    '--account-id [id]',
    z.string().describe('Filter by account ID'),
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
    const result = await client.comments.listInboxComments({
      query: {
        platform: (options.platform as any) || undefined,
        accountId: options.accountId || undefined,
        limit: options.limit,
      },
    })
    output(result, { json: options.json, console })
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
    const result = await client.comments.replyToInboxPost({
      path: { postId },
      body: {
        accountId: options.accountId,
        message: options.message,
        commentId: options.commentId || undefined,
      },
    })
    output(result, { json: options.json, console })
  })

inbox
  .command('inbox reviews', 'List reviews (Facebook, Google Business)')
  .option(
    '--platform [platform]',
    z.string().describe('Filter by platform (facebook, googlebusiness)'),
  )
  .option(
    '--account-id [id]',
    z.string().describe('Filter by account ID'),
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
    const result = await client.reviews.listInboxReviews({
      query: {
        platform: (options.platform as any) || undefined,
        accountId: options.accountId || undefined,
        limit: options.limit,
      },
    })
    output(result, { json: options.json, console })
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
    const result = await client.reviews.replyToInboxReview({
      path: { reviewId },
      body: {
        accountId: options.accountId,
        message: options.message,
      },
    })
    output(result, { json: options.json, console })
  })

export default inbox
