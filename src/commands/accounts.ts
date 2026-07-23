// Account commands: connect (browser OAuth via the website), list, get,
// disconnect, and Pinterest board listing. Accounts are addressed by
// platform name — each workspace holds at most one account per platform.
// Any account/page selection happens inside the hosted OAuth flow, so
// there is no channel-selection step after connecting.
import nodeProcess from 'node:process'
import dedent from 'string-dedent'
import { z } from 'zod'
import { cancel, isCancel, select } from '@clack/prompts'
import { isAgent, openInBrowser } from 'goke'
import { createGroup, platforms, toApiPlatform, type Platform } from '../globals.ts'
import { createClient, resolveBaseUrl } from '../client.ts'
import { output } from '../output.ts'

const accounts = createGroup()

accounts
  .command(
    'accounts connect [platform]',
    dedent`
      Connect a social media account via OAuth.

      Starts an OAuth flow to authorize Akarso to post on your behalf. Each workspace (profile) holds **at most one account per platform**. Connecting the same platform again replaces the existing connection. Any account or page selection (Facebook Pages, LinkedIn organizations, YouTube channels) happens inside the OAuth flow itself.

      The \`[platform]\` argument is required when called programmatically. Supported platforms: \`x\`, \`twitter\`, \`instagram\`, \`facebook\`, \`linkedin\`, \`tiktok\`, \`youtube\`, \`threads\`, \`pinterest\`, \`bluesky\`, \`googlebusiness\`.

      **Bluesky** connects with an app password instead of OAuth — the browser page shows a short form (generate an app password at https://bsky.app/settings/app-passwords).
    `,
  )
  .action(async (platformArg, options, { fs, console, process }) => {
    let platform: Platform
    if (platformArg) {
      platform = platforms.schema.parse(platformArg)
    } else {
      // goke's injected process exposes stdin as a string, so TTY detection
      // must go through the real node process.
      if (isAgent || !nodeProcess.stdin.isTTY) {
        console.error(
          `Missing platform. Usage: akarso accounts connect <platform> (one of: ${platforms.schema.options.join(', ')})`,
        )
        process.exit(1)
      }
      const selected = await select({
        message: 'Which platform do you want to connect?',
        options: platforms.options,
      })
      if (isCancel(selected)) {
        cancel('Connection cancelled.')
        process.exit(0)
      }
      platform = platforms.schema.parse(selected)
    }

    // The connect page authenticates in the browser and resolves the org
    // (personal org by default) server-side. When --profile is set, pass
    // it as a query param so the connect page targets the right workspace.
    const url = new URL(`/connect/${toApiPlatform(platform)}`, resolveBaseUrl(process.env))
    if (process.env.AKARSO_PROFILE_ID) {
      url.searchParams.set('profile', process.env.AKARSO_PROFILE_ID)
    }

    console.error(`Opening browser to connect ${platform}...`)
    await openInBrowser(url.toString())

    output({ platform, url: url.toString() }, { json: options.json, console })
  })

accounts
  .command(
    'accounts list',
    dedent`
      List all connected social accounts in the current workspace.

      Returns each account's ID, platform, and username. The account \`id\` is what posts target internally — the CLI resolves platform names to account IDs automatically, so you rarely need it directly. Pass \`--profile\` to list accounts from a different profile.
    `,
  )
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v2/accounts')
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

accounts
  .command(
    'accounts get <platform>',
    dedent`
      Get detailed information about the connected account for a specific platform.

      Returns the account's ID, username, display name, and profile URL. Errors if no account is connected for the given platform.
    `,
  )
  .action(async (platformArg, options, { fs, console, process }) => {
    const platform = toApiPlatform(platforms.schema.parse(platformArg))
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v2/accounts')
    if (data instanceof Error) throw data
    const matches = data.accounts.filter((entry) => entry.platform === platform)
    if (matches.length === 0) {
      console.error(`No ${platform} account connected. Run \`akarso accounts connect ${platform}\`.`)
      process.exit(1)
      return
    }
    if (matches.length > 1) {
      console.error(
        `Multiple ${platform} accounts are connected. Run \`akarso accounts connect ${platform}\` and choose which one to keep.`,
      )
    }
    output(matches.length === 1 ? matches[0] : { accounts: matches }, { json: options.json, console })
  })

accounts
  .command(
    'accounts disconnect <platform>',
    dedent`
      Disconnect a social account from your workspace.

      Removes the OAuth connection for the given platform. Existing posts are not deleted, but you will no longer be able to publish or manage content on that platform until you reconnect.
    `,
  )
  .action(async (platformArg, options, { fs, console, process }) => {
    const platform = toApiPlatform(platforms.schema.parse(platformArg))
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const list = await client('/api/v2/accounts')
    if (list instanceof Error) throw list
    // Duplicates can exist when one connect flow granted several pages at
    // once — "disconnect <platform>" removes the whole platform
    // connection, so every matching account is disconnected.
    const matches = list.accounts.filter((entry) => entry.platform === platform)
    if (matches.length === 0) {
      console.error(`No ${platform} account connected.`)
      process.exit(1)
      return
    }
    for (const account of matches) {
      const data = await client('/api/v2/accounts/:accountId', {
        method: 'DELETE',
        params: { accountId: account.id },
      })
      if (data instanceof Error) throw data
    }
    output({ success: true, disconnected: matches.length }, { json: options.json, console })
  })

accounts
  .command(
    'accounts pinterest-boards',
    dedent`
      List the boards of the connected Pinterest account.

      Use a board's \`id\` with \`posts create --pinterest-board <id>\` — Pinterest requires a target board on every pin.
    `,
  )
  .option(
    '--account-id [id]',
    z.string().describe('Pinterest account ID (defaults to the workspace account)'),
  )
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v2/pinterest/boards', {
      query: { accountId: options.accountId || undefined },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

export default accounts
