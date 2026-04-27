import { cancel, isCancel, select } from '@clack/prompts'
import { openInBrowser } from 'goke'
import { z } from 'zod'
import { createGroup, platforms, type Platform } from '../globals.ts'
import { createClient } from '../zernio.ts'
import { output } from '../output.ts'

const accounts = createGroup()

const defaultConnectUrl = 'https://akarso-website-preview.remorses.workers.dev'

accounts
  .command('accounts connect [platform]', 'Connect a social account')
  .option(
    '--profile-id <id>',
    z.string().describe('Profile ID to connect the account to'),
  )
  .option(
    '--connect-url [url]',
    z.string().describe('Akarso connect website URL'),
  )
  .action(async (platformArg, options, { console, process }) => {
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

    const connectUrl = options.connectUrl || process.env.AKARSO_CONNECT_URL || defaultConnectUrl
    const url = new URL(`/connect/${platform}`, connectUrl)
    url.searchParams.set('profileId', options.profileId)

    console.error(`Opening browser to connect ${platform}...`)
    openInBrowser(url.toString())

    output(
      {
        platform,
        profileId: options.profileId,
        url: url.toString(),
      },
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
