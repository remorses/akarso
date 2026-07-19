// Inbox commands: comments and reviews on published posts.
// Comments work as async imports: `inbox sync <postId>` starts an import,
// `inbox syncs` shows its status, `inbox comments` reads the imported
// comments, `inbox reply` publishes replies, and `inbox comment-action`
// moderates. Reviews (Google Business) follow the same sync-then-read flow.
import { z } from 'zod';
import dedent from 'string-dedent';
import { createGroup, platforms, toApiPlatform } from "../globals.js";
import { createClient } from "../client.js";
import { output } from "../output.js";
const inbox = createGroup();
inbox
    .command('inbox sync <postId>', dedent `
      Start an async import of comments on a published post.

      Comments are not fetched in real time; they are imported as a background job. After starting a sync, check its progress with \`inbox syncs\`, then read the results with \`inbox comments\`.

      **Supported platforms for comment import:** \`facebook\`, \`instagram\`, \`linkedin\`, \`youtube\`, \`tiktok\`, \`reddit\`, \`threads\`, \`mastodon\`, \`bluesky\`.
    `)
    .example('akarso inbox sync post_123 --platform instagram')
    .option('--platform <platform>', platforms.commentsSchema.describe('Platform to import comments from'))
    .action(async (postId, options, { fs, console, process }) => {
    const client = await createClient({
        apiKey: options.apiKey,
        fs,
        env: process.env,
    });
    const data = await client('/api/v1/inbox/comments/sync', {
        method: 'POST',
        body: {
            postId,
            platform: toApiPlatform(options.platform),
        },
    });
    if (data instanceof Error)
        throw data;
    output(data, { json: options.json, console });
});
inbox
    .command('inbox syncs', dedent `
      List comment import jobs and their current status.

      Shows all sync jobs (pending, in progress, completed, failed) for the current workspace. Use \`--post-id\` to filter by a specific post. Use this to check if a \`inbox sync\` job has completed before reading comments with \`inbox comments\`.
    `)
    .option('--post-id [id]', z.string().describe('Filter by post ID'))
    .option('--limit [n]', z.number().default(20).describe('Maximum imports to return'))
    .action(async (options, { fs, console, process }) => {
    const client = await createClient({
        apiKey: options.apiKey,
        fs,
        env: process.env,
    });
    const data = await client('/api/v1/inbox/comments/sync', {
        query: {
            postId: options.postId || undefined,
            limit: options.limit,
        },
    });
    if (data instanceof Error)
        throw data;
    output(data, { json: options.json, console });
});
inbox
    .command('inbox comments', dedent `
      List previously imported comments. You must run \`inbox sync <postId>\` first.

      Returns comments with their author, text, timestamp, and platform. Filter by \`--post-id\` or \`--platform\`. Each comment has an ID that can be used with \`inbox reply\` (to reply to it) or \`inbox comment-action\` (to moderate it).
    `)
    .option('--post-id [id]', z.string().describe('Filter by post ID'))
    .option('--platform [platform]', platforms.commentsSchema.describe('Filter by platform'))
    .option('--limit [n]', z.number().default(20).describe('Maximum comments to return'))
    .action(async (options, { fs, console, process }) => {
    const client = await createClient({
        apiKey: options.apiKey,
        fs,
        env: process.env,
    });
    const data = await client('/api/v1/inbox/comments', {
        query: {
            postId: options.postId || undefined,
            platform: options.platform ? toApiPlatform(options.platform) : undefined,
            limit: options.limit,
        },
    });
    if (data instanceof Error)
        throw data;
    output(data, { json: options.json, console });
});
inbox
    .command('inbox reply <postId>', dedent `
      Publish a reply in a post's comment section on a specific platform.

      Without \`--comment-id\`, posts a new top-level comment on the post. With \`--comment-id\`, replies to a specific imported comment (threaded reply).

      **Supported platforms for replies:** \`tiktok\`, \`youtube\`, \`instagram\`, \`facebook\`, \`threads\`, \`linkedin\`, \`reddit\`, \`mastodon\`, \`discord\`, \`slack\`, \`bluesky\`.
    `)
    .example('akarso inbox reply post_123 --platform youtube --text "Thanks!"')
    .example('akarso inbox reply post_123 --platform youtube --text "Fixed" --comment-id cmt_456')
    .option('--platform <platform>', platforms.commentRepliesSchema.describe('Platform to reply on'))
    .option('--text <text>', z.string().describe('Reply text'))
    .option('--comment-id [id]', z.string().describe('Imported comment ID to reply to (omit to comment on the post itself)'))
    .action(async (postId, options, { fs, console, process }) => {
    const client = await createClient({
        apiKey: options.apiKey,
        fs,
        env: process.env,
    });
    const data = await client('/api/v1/inbox/reply', {
        method: 'POST',
        body: {
            postId,
            platform: toApiPlatform(options.platform),
            text: options.text,
            parentCommentId: options.commentId || undefined,
        },
    });
    if (data instanceof Error)
        throw data;
    output(data, { json: options.json, console });
});
inbox
    .command('inbox comment-action <commentId>', dedent `
      Perform a moderation action on an imported comment.

      **Available actions:** \`DELETE\`, \`HIDE\`, \`UNHIDE\`, \`LIKE\`, \`UNLIKE\`, \`APPROVE\`, \`REJECT\`. Not all actions are supported on every platform; unsupported actions return an error.

      Optionally pass \`--reason\` to attach a moderation reason, and \`--ban-author\` to also ban the comment author (where the platform supports it).
    `)
    .example('akarso inbox comment-action cmt_123 --action HIDE')
    .option('--action <action>', z
    .enum(['DELETE', 'HIDE', 'UNHIDE', 'LIKE', 'UNLIKE', 'APPROVE', 'REJECT'])
    .describe('Moderation action to run'))
    .option('--reason [reason]', z.string().describe('Optional reason for the action'))
    .option('--ban-author', 'Also ban the comment author where the platform supports it')
    .action(async (commentId, options, { fs, console, process }) => {
    const client = await createClient({
        apiKey: options.apiKey,
        fs,
        env: process.env,
    });
    const data = await client('/api/v1/inbox/comments/:commentId/action', {
        method: 'POST',
        params: { commentId },
        body: {
            action: options.action,
            reason: options.reason || undefined,
            banAuthor: options.banAuthor || undefined,
        },
    });
    if (data instanceof Error)
        throw data;
    output(data, { json: options.json, console });
});
inbox
    .command('inbox reviews', dedent `
      List previously imported Google Business reviews. You must run \`inbox reviews-sync\` first.

      Returns reviews with their author, rating, text, and timestamp. Only available for accounts connected to Google Business Profile. Use \`inbox review-reply\` to respond as the business owner.
    `)
    .option('--limit [n]', z.number().default(20).describe('Maximum reviews to return'))
    .action(async (options, { fs, console, process }) => {
    const client = await createClient({
        apiKey: options.apiKey,
        fs,
        env: process.env,
    });
    const data = await client('/api/v1/inbox/reviews', {
        query: { limit: options.limit },
    });
    if (data instanceof Error)
        throw data;
    output(data, { json: options.json, console });
});
inbox
    .command('inbox reviews-sync', dedent `
      Import reviews from your connected Google Business Profile location.

      Starts an async import of the most recent reviews (default: 50, configurable with \`--count\`). After the import completes, read the results with \`inbox reviews\`. Only works if a Google Business account is connected and a location (channel) has been selected.
    `)
    .option('--count [n]', z.number().default(50).describe('Number of most recent reviews to import'))
    .action(async (options, { fs, console, process }) => {
    const client = await createClient({
        apiKey: options.apiKey,
        fs,
        env: process.env,
    });
    const data = await client('/api/v1/inbox/reviews/sync', {
        method: 'POST',
        body: { count: options.count },
    });
    if (data instanceof Error)
        throw data;
    output(data, { json: options.json, console });
});
inbox
    .command('inbox review-reply <reviewId>', dedent `
      Reply to a Google Business review as the business owner.

      Posts a public owner response to the specified review. The review must have been previously imported with \`inbox reviews-sync\`. Use \`inbox reviews\` to find review IDs.
    `)
    .option('--text <text>', z.string().describe('Reply text'))
    .action(async (reviewId, options, { fs, console, process }) => {
    const client = await createClient({
        apiKey: options.apiKey,
        fs,
        env: process.env,
    });
    const data = await client('/api/v1/inbox/reviews/:reviewId/reply', {
        method: 'POST',
        params: { reviewId },
        body: { text: options.text },
    });
    if (data instanceof Error)
        throw data;
    output(data, { json: options.json, console });
});
export default inbox;
