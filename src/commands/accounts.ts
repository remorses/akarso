import { cancel, isCancel, select } from '@clack/prompts'
import { openInBrowser } from 'goke'
import { z } from 'zod'
import { createGroup, platforms, type Platform } from '../globals.ts'
import { createClient, resolveBaseUrl } from '../zernio.ts'
import { output } from '../output.ts'

const accounts = createGroup()

accounts
  .command('accounts connect [platform]', 'Connect a social account')
  .action(async (platformArg, options, { fs, console, process }) => {
    let platform: Platform
    if (platformArg) {
      platform = platforms.schema.parse(platformArg)
    } else {
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

    // Fetch the user's profile via the proxy to get their Zernio profile ID.
    // The proxy's /profiles route returns { profiles: Profile[] } matching the
    // Zernio SDK's listProfiles response shape, so no casts needed.
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const { data } = await client.profiles.listProfiles()
    const profiles = data?.profiles ?? []
    if (profiles.length === 0) {
      console.error('Could not resolve your profile. Make sure your subscription is active.')
      process.exit(1)
    }
    const profileId = profiles[0]?._id
    if (!profileId) {
      console.error('Could not resolve profile ID.')
      process.exit(1)
      return
    }

    // Build connect URL using the website (not the /api/v1 proxy)
    const apiUrl = resolveBaseUrl(process.env)
    const websiteUrl = apiUrl.endsWith('/api/v1') ? apiUrl.slice(0, -7) : apiUrl
    const url = new URL(`/connect/${platform}`, websiteUrl)
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
    '--profile-id [id]',
    z.string().describe('Filter by profile ID'),
  )
  .option(
    '--platform [platform]',
    z.string().describe('Filter by platform'),
  )
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const { data } = await client.accounts.listAccounts({
      query: {
        profileId: options.profileId || undefined,
        platform: options.platform || undefined,
      },
    })
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
    const { data } = await client.accounts.listAccounts()
    const account = data?.accounts?.find(
      (a) => a._id === accountId,
    )
    if (!account) {
      console.error(`Account ${accountId} not found.`)
      process.exit(1)
    }
    output(account, { json: options.json, console })
  })

accounts
  .command('accounts health', 'Check token health for all accounts')
  .option(
    '--profile-id [id]',
    z.string().describe('Filter by profile ID'),
  )
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
    const { data } = await client.accounts.getAllAccountsHealth({
      query: {
        profileId: options.profileId || undefined,
        platform: options.platform || undefined,
      },
    })
    output(data, { json: options.json, console })
  })

export default accounts
