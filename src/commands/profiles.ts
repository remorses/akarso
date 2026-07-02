import { createGroup } from '../globals.ts'
import { createClient } from '../client.ts'
import { output } from '../output.ts'

const profiles = createGroup()

profiles
  .command('profiles list', 'List all profiles')
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

export default profiles
