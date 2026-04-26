import { openInBrowser } from 'goke'
import { Zernio } from '@zernio/node'
import { z } from 'zod'
import { createGroup } from '../globals.ts'
import { loadConfig, saveConfig, resolveApiKey } from '../zernio.ts'

const auth = createGroup()

auth
  .command('auth login', 'Log in via browser OAuth (creates API key automatically)')
  .option(
    '--device-name [name]',
    z.string().describe('Custom device name for the API key label'),
  )
  .action(async (_options, { console }) => {
    console.error('Opening browser for login...')
    const url = 'https://zernio.com/dashboard/api-keys'
    openInBrowser(url)
    console.error('Create an API key at the dashboard, then run:')
    console.error('  akarso auth set --key <your-key>')
  })

auth
  .command('auth set', 'Save API key manually')
  .option('--key <key>', z.string().describe('Your Zernio API key'))
  .action(async (options, { fs, console }) => {
    await saveConfig(fs, { apiKey: options.key })
    console.error('API key saved to ~/.akarso/config.json')
  })

auth
  .command('auth check', 'Verify API key is valid')
  .action(async (options, { fs, console, process }) => {
    const apiKey = await resolveApiKey({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    if (!apiKey) {
      console.error('No API key found. Run `akarso auth login` first.')
      process.exit(1)
    }
    try {
      const client = new Zernio({
        apiKey,
        baseURL: process.env.ZERNIO_API_URL || undefined,
      })
      const { data } = await client.profiles.listProfiles()
      const profiles = data?.profiles ?? []
      const count = Array.isArray(profiles) ? profiles.length : 0
      console.error('API key is valid.')
      console.error(`Found ${count} profile(s).`)
    } catch (err) {
      console.error(
        `API key validation failed: ${err instanceof Error ? err.message : String(err)}`,
      )
      process.exit(1)
    }
  })

export default auth
