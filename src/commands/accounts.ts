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
    const result = await client.accounts.listAccounts({
      query: {
        profileId: options.profileId || undefined,
        platform: options.platform || undefined,
      },
    })
    output(result, { json: options.json, console })
  })

accounts
  .command('accounts get <accountId>', 'Get account details')
  .action(async (accountId, options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const result = await client.accounts.listAccounts()
    const account = result.accounts?.find(
      (a) => a._id === accountId || (a as any).id === accountId,
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
    z.string().describe('Filter by platform'),
  )
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const result = await client.accounts.getAllAccountsHealth({
      query: {
        profileId: options.profileId || undefined,
        platform: (options.platform as any) || undefined,
      },
    })
    output(result, { json: options.json, console })
  })

export default accounts
