import { openInBrowser } from 'goke'
import { z } from 'zod'
import { createAuthClient } from 'better-auth/client'
import { deviceAuthorizationClient } from 'better-auth/client/plugins'
import { createGroup } from '../globals.ts'
import { loadConfig, saveConfig, resolveApiKey, resolveBaseUrl } from '../zernio.ts'

const auth = createGroup()

/** Resolve the website base URL (not the /api/v1 proxy URL). */
function getWebsiteUrl(env: Record<string, string | undefined>): string {
  const apiUrl = resolveBaseUrl(env)
  // Strip /api/v1 suffix to get the website root
  if (apiUrl.endsWith('/api/v1')) return apiUrl.slice(0, -7)
  return 'https://akarso-website.remorses.workers.dev'
}

auth
  .command('auth login', 'Login via browser (device flow)')
  .action(async (options, { console, process, fs }) => {
    const websiteUrl = getWebsiteUrl(process.env)

    const client = createAuthClient({
      baseURL: websiteUrl,
      plugins: [deviceAuthorizationClient()],
    })

    // 1. Request a device code
    console.error('Requesting device code...')
    const { data, error } = await client.device.code({
      client_id: 'akarso-cli',
    })
    if (error || !data) {
      console.error(`Failed to request device code: ${error?.error_description || 'unknown error'}`)
      process.exit(1)
      return
    }

    const verificationUrl = data.verification_uri_complete
      || `${websiteUrl}/device?user_code=${data.user_code}`

    console.error('')
    console.error(`  Open: ${verificationUrl}`)
    console.error(`  Code: ${data.user_code}`)
    console.error('')

    // 2. Open the browser
    await openInBrowser(verificationUrl)
    console.error('Waiting for approval...')

    // 3. Poll until approved
    const pollInterval = (data.interval || 5) * 1000
    const deadline = Date.now() + (data.expires_in || 300) * 1000

    let accessToken: string | undefined
    while (Date.now() < deadline) {
      await new Promise((r) => { setTimeout(r, pollInterval) })
      const { data: tokenData, error: pollError } = await client.device.token({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: data.device_code,
        client_id: 'akarso-cli',
      })
      if (tokenData?.access_token) {
        accessToken = tokenData.access_token
        break
      }
      const errorCode = pollError?.error
      if (errorCode === 'authorization_pending' || errorCode === 'slow_down') continue
      if (pollError) {
        console.error(`Device auth failed: ${pollError?.error_description || 'unknown'}`)
        process.exit(1)
      }
    }

    if (!accessToken) {
      console.error('Device code expired. Try again.')
      process.exit(1)
    }

    // 4. Create an API key using the authenticated session
    console.error('Creating API key...')
    const apiKeyResponse = await fetch(new URL('/api/auth/api-key/create', websiteUrl), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'CLI Login', prefix: 'ak_' }),
    })

    if (!apiKeyResponse.ok) {
      console.error('Failed to create API key. You can create one manually at:')
      console.error(`  ${websiteUrl}/dashboard`)
      // Still save the bearer token as fallback
      await saveConfig(fs, { apiKey: accessToken })
      console.error('Session token saved as fallback.')
      return
    }

    const apiKeyData = await apiKeyResponse.json() as { key?: string }
    if (!apiKeyData.key) {
      console.error('Failed to create API key. Save one manually with:')
      console.error('  akarso auth set --key <key>')
      await saveConfig(fs, { apiKey: accessToken })
      return
    }

    await saveConfig(fs, { apiKey: apiKeyData.key })
    console.error('')
    console.error('Logged in successfully! API key saved to ~/.akarso/config.json')
    console.error('')
    console.error('You can now use the CLI:')
    console.error('  akarso accounts list')
    console.error('  akarso posts create --text "Hello!" --accounts twitter --publish-now')
  })

auth
  .command('auth set', 'Save API key manually')
  .option('--key <key>', z.string().describe('Your API key'))
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
      const baseUrl = resolveBaseUrl(process.env)
      const response = await fetch(new URL('/profiles', baseUrl), {
        headers: { 'x-api-key': apiKey! },
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }
      console.error('API key is valid.')
    } catch (err) {
      console.error(
        `API key validation failed: ${err instanceof Error ? err.message : String(err)}`,
      )
      process.exit(1)
    }
  })

auth
  .command('subscribe', 'Open the dashboard to subscribe or manage your plan')
  .action(async (_options, { console, process }) => {
    const websiteUrl = getWebsiteUrl(process.env)
    const subscribeUrl = `${websiteUrl}/dashboard`
    console.error('Opening your browser to manage your subscription:')
    console.error(`  ${subscribeUrl}`)
    console.error('')
    await openInBrowser(subscribeUrl)
  })

export default auth
