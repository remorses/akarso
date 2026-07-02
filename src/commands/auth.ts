import nodeProcess from 'node:process'
import { openInBrowser } from 'goke'
import { z } from 'zod'
import dedent from 'string-dedent'
import { createAuthClient } from 'better-auth/client'
import { deviceAuthorizationClient } from 'better-auth/client/plugins'
import { createGroup } from '../globals.ts'
import { setServerConfig, resolveBaseUrl, createClient } from '../zernio.ts'

/** Response from BetterAuth's POST /api/auth/api-key/create endpoint.
 *  The `key` field contains the plaintext API key (only returned once). */
interface CreateApiKeyResponse {
  key: string | null
}

const auth = createGroup()

/** Resolve the website base URL (not the /api proxy URL). */
function getWebsiteUrl(env: Record<string, string | undefined>): string {
  const apiUrl = resolveBaseUrl(env)
  // Strip /api suffix to get the website root
  if (apiUrl.endsWith('/api')) return apiUrl.slice(0, -4)
  return 'https://akarso.co'
}

auth
  .command('auth login', 'Login via browser (device flow)')
  .action(async (options, { console, process, fs }) => {
    // Device login must stay alive while the user approves in the browser,
    // so it needs a real interactive terminal. Fail fast otherwise.
    // goke's injected process does not expose isTTY, so use the real node process.
    if (!nodeProcess.stdout.isTTY) {
      console.error(dedent`
        akarso auth login needs an interactive terminal and must stay alive while you approve the browser login.

        Run it in a background terminal session like tuistory or tmux, then wait for the URL/code:

          bunx tuistory launch "akarso auth login" -s akarso-login
          bunx tuistory -s akarso-login wait "/code:|https?:\\/\\//i" --timeout 15000

        The login command exits by itself after successful browser approval.
        Alternatively save an existing API key with: akarso auth set --key <key>
      `)
      process.exit(1)
    }

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
      console.error(dedent`
        Failed to create API key. You can create one manually at:
          ${websiteUrl}/dashboard
      `)
      // Still save the bearer token as fallback
      await setServerConfig({ fs, env: process.env, data: { apiKey: accessToken } })
      console.error('Session token saved as fallback.')
      return
    }

    const apiKeyData = await apiKeyResponse.json() as CreateApiKeyResponse
    if (!apiKeyData.key) {
      console.error(dedent`
        Failed to create API key. Save one manually with:
          akarso auth set --key <key>
      `)
      await setServerConfig({ fs, env: process.env, data: { apiKey: accessToken } })
      return
    }

    await setServerConfig({ fs, env: process.env, data: { apiKey: apiKeyData.key } })
    console.error(dedent`

      Logged in successfully! API key saved to ~/.akarso/config.json

      You can now use the CLI:
        akarso accounts list
        akarso posts create --text "Hello!" --accounts twitter --publish-now
    `)
  })

auth
  .command('auth set', 'Save API key manually (pass it with `--key`)')
  .option('--key <key>', z.string().describe('Your API key'))
  .action(async (options, { fs, console, process }) => {
    await setServerConfig({ fs, env: process.env, data: { apiKey: options.key } })
    console.error('API key saved to ~/.akarso/config.json')
  })

auth
  .command('auth check', 'Verify API key is valid')
  .action(async (options, { fs, console, process }) => {
    try {
      const client = await createClient({
        apiKey: options.apiKey,
        fs,
        env: process.env,
      })
      const { error } = await client.profiles.listProfiles()
      if (error) {
        throw new Error(`API returned error: ${JSON.stringify(error)}`)
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
