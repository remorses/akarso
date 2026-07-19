// Account commands: connect (browser OAuth via the website), list, get,
// health checks, disconnect, and channel selection for platforms that
// need a publishing target (Facebook Page, LinkedIn org, YouTube channel,
// Google Business location). Accounts are addressed by platform name —
// each workspace holds at most one account per platform.
import nodeProcess from 'node:process';
import { z } from 'zod';
import dedent from 'string-dedent';
import { cancel, isCancel, select } from '@clack/prompts';
import { isAgent, openInBrowser } from 'goke';
import { createGroup, platforms, toApiPlatform } from "../globals.js";
import { createClient, resolveBaseUrl } from "../client.js";
import { output } from "../output.js";
const accounts = createGroup();
accounts
    .command('accounts connect [platform]', dedent `
      Connect a social media account via OAuth.

      Starts an OAuth flow to authorize Akarso to post on your behalf. Each workspace (profile) holds **at most one account per platform**. Connecting the same platform again replaces the existing connection.

      The \`[platform]\` argument is required when called programmatically. Supported platforms: \`x\`, \`twitter\`, \`instagram\`, \`facebook\`, \`linkedin\`, \`tiktok\`, \`youtube\`, \`threads\`, \`reddit\`, \`pinterest\`, \`bluesky\`, \`googlebusiness\`, \`mastodon\`, \`discord\`, \`slack\`.

      **Important:** some platforms (facebook, instagram, linkedin, youtube, googlebusiness) require a channel selection after connecting. Use \`accounts get <platform>\` to see available channels, then \`accounts set-channel <platform> --channel-id <id>\` to pick one. Posting will fail until a channel is selected.
    `)
    .action(async (platformArg, options, { fs, console, process }) => {
    let platform;
    if (platformArg) {
        platform = platforms.schema.parse(platformArg);
    }
    else {
        // goke's injected process exposes stdin as a string, so TTY detection
        // must go through the real node process.
        if (isAgent || !nodeProcess.stdin.isTTY) {
            console.error(`Missing platform. Usage: akarso accounts connect <platform> (one of: ${platforms.schema.options.join(', ')})`);
            process.exit(1);
        }
        const selected = await select({
            message: 'Which platform do you want to connect?',
            options: platforms.options,
        });
        if (isCancel(selected)) {
            cancel('Connection cancelled.');
            process.exit(0);
        }
        platform = platforms.schema.parse(selected);
    }
    // The connect page authenticates in the browser and resolves the org
    // (personal org by default) server-side. When --profile is set, pass
    // it as a query param so the connect page targets the right workspace.
    const url = new URL(`/connect/${platform}`, resolveBaseUrl(process.env));
    if (process.env.AKARSO_PROFILE_ID) {
        url.searchParams.set('profile', process.env.AKARSO_PROFILE_ID);
    }
    console.error(`Opening browser to connect ${platform}...`);
    await openInBrowser(url.toString());
    output({ platform, url: url.toString() }, { json: options.json, console });
});
accounts
    .command('accounts list', dedent `
      List all connected social accounts in the current workspace.

      Returns each account's platform, connection status, username, and whether a publishing channel has been selected. Use this to see which platforms are ready for posting and which still need channel selection. Pass \`--profile\` to list accounts from a different profile.
    `)
    .action(async (options, { fs, console, process }) => {
    const client = await createClient({
        apiKey: options.apiKey,
        fs,
        env: process.env,
    });
    const data = await client('/api/v1/accounts');
    if (data instanceof Error)
        throw data;
    output(data, { json: options.json, console });
});
accounts
    .command('accounts get <platform>', dedent `
      Get detailed information about the connected account for a specific platform.

      Returns account metadata, connection status, and the list of **selectable channels** (Facebook Pages, LinkedIn organizations, YouTube channels, Google Business locations). Use this before \`accounts set-channel\` to find the correct \`channel-id\`.

      Returns a 404 error if no account is connected for the given platform.
    `)
    .action(async (platformArg, options, { fs, console, process }) => {
    const platform = platforms.schema.parse(platformArg);
    const client = await createClient({
        apiKey: options.apiKey,
        fs,
        env: process.env,
    });
    const data = await client('/api/v1/accounts/:platform', {
        params: { platform: toApiPlatform(platform) },
    });
    if (data instanceof Error) {
        if (data.status === 404) {
            console.error(`No ${platform} account connected. Run \`akarso accounts connect ${platform}\`.`);
            process.exit(1);
        }
        throw data;
    }
    output(data, { json: options.json, console });
});
accounts
    .command('accounts health', dedent `
      Check the connection health of all connected accounts, or a single platform with \`--platform\`.

      Reports whether each account's OAuth token is still valid and the connection is functional. Use this to diagnose posting failures caused by expired or revoked tokens. Accounts with health issues need to be reconnected with \`accounts connect\`.
    `)
    .option('--platform [platform]', platforms.schema.describe('Only check this platform'))
    .action(async (options, { fs, console, process }) => {
    const client = await createClient({
        apiKey: options.apiKey,
        fs,
        env: process.env,
    });
    const data = await client('/api/v1/accounts/health', {
        query: {
            platform: options.platform ? toApiPlatform(options.platform) : undefined,
        },
    });
    if (data instanceof Error)
        throw data;
    output(data, { json: options.json, console });
});
accounts
    .command('accounts disconnect <platform>', dedent `
      Disconnect a social account from your workspace.

      Removes the OAuth connection for the given platform. Existing posts are not deleted, but you will no longer be able to publish or manage content on that platform until you reconnect.
    `)
    .action(async (platformArg, options, { fs, console, process }) => {
    const platform = platforms.schema.parse(platformArg);
    const client = await createClient({
        apiKey: options.apiKey,
        fs,
        env: process.env,
    });
    const data = await client('/api/v1/accounts/:platform', {
        method: 'DELETE',
        params: { platform: toApiPlatform(platform) },
    });
    if (data instanceof Error)
        throw data;
    output(data, { json: options.json, console });
});
accounts
    .command('accounts set-channel <platform>', dedent `
      Select the publishing target for a connected account that requires channel selection.

      Some platforms have multiple publishing destinations (e.g. a Facebook user manages several Pages, a LinkedIn user has personal profile vs company pages). This command picks which one to publish to.

      **Platforms that require this:** \`facebook\`, \`instagram\` (via Facebook Page), \`linkedin\`, \`youtube\`, \`googlebusiness\`. Other platforms post directly to the connected account without channel selection.

      **Posting will fail** if the account requires channel selection and none has been set. Run \`accounts get <platform>\` first to see the list of available channels and their IDs.
    `)
    .example('akarso accounts set-channel facebook --channel-id page_123')
    .option('--channel-id <id>', z.string().describe('Channel ID from `accounts get <platform>`'))
    .action(async (platformArg, options, { fs, console, process }) => {
    const platform = platforms.channelSelectSchema.parse(platformArg);
    const client = await createClient({
        apiKey: options.apiKey,
        fs,
        env: process.env,
    });
    const data = await client('/api/v1/accounts/:platform/set-channel', {
        method: 'POST',
        params: { platform: toApiPlatform(platform) },
        body: { channelId: options.channelId },
    });
    if (data instanceof Error)
        throw data;
    output(data, { json: options.json, console });
});
export default accounts;
