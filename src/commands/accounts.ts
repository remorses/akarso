import nodeProcess from 'node:process'
import { cancel, isCancel, select } from '@clack/prompts'
import { isAgent, openInBrowser } from 'goke'
import { createGroup, platforms, type Platform } from '../globals.ts'
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

    // Fetch the user's profile via the proxy to get their profile ID.
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/profiles')
    if (data instanceof Error) throw data
    const profiles = data.profiles
    if (profiles.length === 0) {
      console.error('Could not resolve your profile. Run `akarso auth check` to verify your API key.')
      process.exit(1)
    }
    const profileId = profiles[0]?._id
    if (!profileId) {
      console.error('Could not resolve profile ID.')
      process.exit(1)
      return
    }

    // Build the connect URL on the website (same host as the API)
    const url = new URL(`/connect/${platform}`, resolveBaseUrl(process.env))
    url.searchParams.set('profileId', profileId)

    console.error(`Opening browser to connect ${platform}...`)
    await openInBrowser(url.toString())

    output(
      { platform, profileId, url: url.toString() },
      { json: options.json, console },
    )
  })

accounts
  .command('accounts list', 'List connected social accounts')
  .option(
    '--platform [platform]',
    platforms.schema.describe('Filter by platform'),
  )
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/accounts', {
      query: {
        platform: options.platform || undefined,
      },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

accounts
  .command('accounts get <accountId>', 'Get account details')
  .action(async (accountId, options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/accounts/:accountId', {
      params: { accountId },
    })
    if (data instanceof Error) {
      if (data.status === 404) {
        console.error(`Account ${accountId} not found.`)
        process.exit(1)
      }
      throw data
    }
    output(data, { json: options.json, console })
  })

accounts
  .command('accounts health', 'Check token health for all accounts')
  .option(
    '--platform [platform]',
    platforms.schema.describe('Filter by platform'),
  )
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/accounts/health', {
      query: {
        platform: options.platform || undefined,
      },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

export default accounts
