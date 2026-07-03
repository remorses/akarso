// Profile commands: list and create the workspaces inside your organization.
// Each profile holds its own connected accounts and posts; billing, members,
// and API keys are shared org-wide. API keys are pinned to one profile at
// creation (dashboard picker) — every other CLI command automatically
// operates on the key's profile, so nothing else needs a --profile flag.
import { z } from 'zod'
import { createGroup } from '../globals.ts'
import { createClient } from '../client.ts'
import { output } from '../output.ts'

const profiles = createGroup()

profiles
  .command('profiles list', 'List the profiles (workspaces) of your organization')
  .example('akarso profiles list')
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/profiles')
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

profiles
  .command('profiles create', 'Create a new profile (admin only, plan limits apply)')
  .option('--name <name>', z.string().describe('Display name for the new profile'))
  .example('akarso profiles create --name "Client Acme"')
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/profiles', {
      method: 'POST',
      body: { name: options.name },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

export default profiles
