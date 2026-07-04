// Profile commands: list and create the workspaces inside your organization.
// Each profile holds its own connected accounts and posts; billing, members,
// and API keys are shared org-wide. API keys are pinned to one profile at
// creation (dashboard picker) — every other CLI command automatically
// operates on the key's profile, so nothing else needs a --profile flag.
import { z } from 'zod'
import dedent from 'string-dedent'
import { createGroup } from '../globals.ts'
import { createClient } from '../client.ts'
import { output } from '../output.ts'

const profiles = createGroup()

profiles
  .command(
    'profiles list',
    dedent`
      List all profiles (workspaces) in your organization.

      Each profile is an isolated workspace with its own connected social accounts and posts. The response marks which profile is \`current\` (the one your API key targets) and which is the \`default\`.

      API keys are pinned to one profile at creation, so all other commands automatically operate on the key's profile without needing a \`--profile\` flag.
    `,
  )
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
  .command(
    'profiles create',
    dedent`
      Create a new profile (workspace) in your organization.

      **Admin only.** The number of profiles is limited by your plan (Starter: 1, Pro: 3, Business: 15). Each profile gets its own set of connected accounts and posts, but billing and team members are shared across the org.

      After creating a profile, generate a new API key from the dashboard pinned to that profile, or use the dashboard workspace tabs to manage it.
    `,
  )
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

profiles
  .command(
    'profiles rename <profileId>',
    dedent`
      Rename a profile (workspace) in your organization.

      **Admin only.** Changes the display name shown in the dashboard and in \`profiles list\`. Use \`profiles list\` to find profile IDs.
    `,
  )
  .option('--name <name>', z.string().describe('New display name for the profile'))
  .example('akarso profiles rename 01JXYZ... --name "Client Acme"')
  .action(async (profileId, options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const data = await client('/api/v1/profiles/:profileId', {
      method: 'PATCH',
      params: { profileId },
      body: { name: options.name },
    })
    if (data instanceof Error) throw data
    output(data, { json: options.json, console })
  })

export default profiles
