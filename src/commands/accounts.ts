import { cancel, isCancel, select } from '@clack/prompts'
import { openInBrowser } from 'goke'
import nodeProcess from 'node:process'
import { z } from 'zod'
import { createGroup, platforms, type Platform } from '../globals.ts'
import { createClient } from '../zernio.ts'
import { output } from '../output.ts'

const accounts = createGroup()

const defaultConnectUrl = 'https://akarso-website-preview.remorses.workers.dev'

type Profile = {
  _id?: string
  id?: string
  name?: string
}

function getProfileId(profile: Profile) {
  return profile._id || profile.id
}

accounts
  .command('accounts connect [platform]', 'Connect a social account')
  .option(
    '--profile-id [id]',
    z.string().describe('Profile ID to connect the account to'),
  )
  .option(
    '--connect-url [url]',
    z.string().describe('Akarso connect website URL'),
  )
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

    let profileId = options.profileId
    if (!profileId) {
      const client = await createClient({
        apiKey: options.apiKey,
        fs,
        env: process.env,
      })
      const { data } = await client.profiles.listProfiles()
      const profiles: Profile[] = data?.profiles ?? []
      if (profiles.length === 0) {
        console.error('No profiles found. Create a profile before connecting accounts.')
        process.exit(1)
      }

      if (profiles.length === 1) {
        const profile = profiles[0]
        profileId = profile ? getProfileId(profile) : undefined
      } else {
        if (!nodeProcess.stdin.isTTY) {
          console.error('Multiple profiles found. Pass --profile-id <id> in non-interactive environments.')
          process.exit(1)
        }

        const selected = await select({
          message: 'Which profile do you want to connect this account to?',
          options: profiles
            .map((profile) => {
              const id = getProfileId(profile)
              if (!id) return undefined
              return {
                value: id,
                label: profile.name ? `${profile.name} (${id})` : id,
              }
            })
            .filter((profile) => profile !== undefined),
        })
        if (isCancel(selected)) {
          cancel('Connection cancelled.')
          process.exit(0)
        }
        profileId = z.string().min(1).parse(selected)
      }
    }

    if (!profileId) {
      console.error('Could not resolve a profile ID.')
      process.exit(1)
      return
    }
    const resolvedProfileId = profileId

    const connectUrl = options.connectUrl || process.env.AKARSO_CONNECT_URL || defaultConnectUrl
    const url = new URL(`/connect/${platform}`, connectUrl)
    url.searchParams.set('profileId', resolvedProfileId)

    console.error(`Opening browser to connect ${platform}...`)
    await openInBrowser(url.toString())

    output(
      {
        platform,
        profileId: resolvedProfileId,
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
