import { z } from 'zod'
import { createGroup, platforms } from '../globals.ts'
import { createClient } from '../zernio.ts'
import { output } from '../output.ts'

const posts = createGroup()

posts
  .command('posts create', 'Create, schedule, or publish a post')
  .option('--text <content>', z.string().describe('Post text content'))
  .option(
    '--accounts <ids>',
    z.string().describe('Comma-separated account IDs'),
  )
  .option('--publish-now', 'Publish immediately')
  .option(
    '--scheduled-at [iso]',
    z.string().describe('Schedule for a future time (ISO 8601)'),
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
    const platforms = accountIds.map((accountId) => ({
      platform: options.platform,
      accountId,
    }))

    const mediaItems = options.mediaUrls
      ? options.mediaUrls
          .split(',')
          .map((url) => ({ url: url.trim(), type: 'image' as const }))
      : undefined

    const { data } = await client.posts.createPost({
      body: {
        content: options.text,
        title: options.title || undefined,
        platforms,
        publishNow: options.publishNow || false,
        scheduledFor: options.scheduledAt || undefined,
        mediaItems: mediaItems || undefined,
      },
    })

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
  .option(
    '--profile-id [id]',
    z.string().describe('Filter by profile ID'),
  )
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const { data } = await client.posts.listPosts({
      query: {
        status: options.status || undefined,
        limit: options.limit,
        profileId: options.profileId || undefined,
      },
    })
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
    const { data } = await client.posts.getPost({ path: { postId } })
    output(data, { json: options.json, console })
  })

posts
  .command('posts delete <postId>', 'Delete a post')
  .action(async (postId, options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const { data } = await client.posts.deletePost({ path: { postId } })
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
    const { data } = await client.posts.retryPost({ path: { postId } })
    output(data as object, { json: options.json, console })
  })

export default posts
