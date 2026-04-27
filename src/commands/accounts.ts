import { z } from 'zod'
import { createGroup } from '../globals.ts'
import { createClient } from '../zernio.ts'
import { output } from '../output.ts'

const accounts = createGroup()

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
    z.enum(['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'youtube', 'threads', 'pinterest', 'reddit', 'bluesky', 'googlebusiness', 'telegram', 'snapchat', 'discord']).describe('Filter by platform'),
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
