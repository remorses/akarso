// Account commands: connect (browser OAuth via the website), list, get,
// health checks, disconnect, and channel selection for platforms that
// need a publishing target (Facebook Page, LinkedIn org, YouTube channel,
// Google Business location). Accounts are addressed by platform name —
// each workspace holds at most one account per platform.
import nodeProcess from 'node:process'
import { z } from 'zod'
import { cancel, isCancel, select } from '@clack/prompts'
import { isAgent, openInBrowser } from 'goke'
import { createGroup, platforms, toApiPlatform, type Platform } from '../globals.ts'
import { createClient, resolveBaseUrl } from '../client.ts'
import { output } from '../output.ts'

const accounts = createGroup()

accounts
  .command('accounts connect [platform]', 'Connect a social account')
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
    // (personal org by default) server-side.
    const url = new URL(`/connect/${platform}`, resolveBaseUrl(process.env))

    console.error(`Opening browser to connect ${platform}...`)
    await openInBrowser(url.toString())

    output({ platform, url: url.toString() }, { json: options.json, console })
  })

accounts
  .command('accounts list', 'List connected social accounts')
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/accounts')
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

accounts
  .command('accounts get <platform>', 'Get the connected account for a platform, including its selectable channels')
  .action(async (platformArg, options, { fs, console, process }) => {
    const platform = platforms.schema.parse(platformArg)
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/accounts/:platform', {
      params: { platform: toApiPlatform(platform) },
    })
    if (data instanceof Error) {
      if (data.status === 404) {
        console.error(`No ${platform} account connected. Run \`akarso accounts connect ${platform}\`.`)
        process.exit(1)
      }
      throw data
    }
    output(data, { json: options.json, console })
  })

accounts
  .command('accounts health', 'Check connection health for all accounts')
  .option(
    '--platform [platform]',
    platforms.schema.describe('Only check this platform'),
  )
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/accounts/health', {
      query: {
        platform: options.platform ? toApiPlatform(options.platform) : undefined,
      },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

accounts
  .command('accounts disconnect <platform>', 'Disconnect the platform account from your workspace')
  .action(async (platformArg, options, { fs, console, process }) => {
    const platform = platforms.schema.parse(platformArg)
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/accounts/:platform', {
      method: 'DELETE',
      params: { platform: toApiPlatform(platform) },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

accounts
  .command(
    'accounts set-channel <platform>',
    'Select the publishing target (Page, organization, channel, or location) for a connected account',
  )
  .example('akarso accounts set-channel facebook --channel-id page_123')
  .option('--channel-id <id>', z.string().describe('Channel ID from `accounts get <platform>`'))
  .action(async (platformArg, options, { fs, console, process }) => {
    const platform = platforms.channelSelectSchema.parse(platformArg)
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/accounts/:platform/set-channel', {
      method: 'POST',
      params: { platform: toApiPlatform(platform) as 'FACEBOOK' },
      body: { channelId: options.channelId },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

export default accounts
