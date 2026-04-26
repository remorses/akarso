import { createGroup } from '../globals.ts'
import { createClient } from '../zernio.ts'
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
    const result = await client.profiles.listProfiles()
    output(result, { json: options.json, console })
  })

export default profiles
