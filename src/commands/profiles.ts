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
    const { data } = await client.profiles.listProfiles()
    output(data, { json: options.json, console })
  })

export default profiles
