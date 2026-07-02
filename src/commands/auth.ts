// Auth commands: browser device-flow login (backed by a goke background
// daemon so it returns immediately, even for agents), manual key storage,
// key validation, logout, and the subscribe shortcut.
import { openInBrowser, isAgent } from 'goke'
import type { GokeFs, GokeConsole } from 'goke'
import { z } from 'zod'
import dedent from 'string-dedent'
import { createAuthClient } from 'better-auth/client'
import { deviceAuthorizationClient } from 'better-auth/client/plugins'
import { createGroup } from '../globals.ts'
import {
  setServerConfig,
  getServerConfig,
  deleteServerConfig,
  resolveBaseUrl,
  createClient,
} from '../client.ts'

/** Response from BetterAuth's POST /api/auth/api-key/create endpoint.
 *  The `key` field contains the plaintext API key (only returned once). */
interface CreateApiKeyResponse {
  key: string | null
}

const auth = createGroup()

/** Exchange an approved device-flow access token for a long-lived API key
 *  and persist it to ~/.akarso/config.json. Falls back to saving the bearer
 *  token itself if key creation fails, so the login still works. */
async function exchangeTokenForApiKey({
  accessToken,
  websiteUrl,
  fs,
  env,
  console,
}: {
  accessToken: string
  websiteUrl: string
  fs: GokeFs
  env: Record<string, string | undefined>
  console: GokeConsole
}): Promise<void> {
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
    await setServerConfig({ fs, env, data: { apiKey: accessToken } })
    console.error('Session token saved as fallback.')
    return
  }

  const apiKeyData = await apiKeyResponse.json() as CreateApiKeyResponse
  if (!apiKeyData.key) {
    console.error(dedent`
      Failed to create API key. Save one manually with:
        akarso auth set --key <key>
    `)
    await setServerConfig({ fs, env, data: { apiKey: accessToken } })
    return
  }

  await setServerConfig({ fs, env, data: { apiKey: apiKeyData.key } })
}

auth
  .command(
    'auth login',
    'Login via browser (device flow). Prints a URL, keeps polling in a background daemon, and returns immediately. Verify with `akarso auth check`.',
  )
  .example('akarso auth login')
  .action(async (options, ctx) => {
    const { console, process, fs } = ctx
    // The website and the API share the same host, so the base URL is both.
    const websiteUrl = resolveBaseUrl(process.env)
    const client = createAuthClient({
      baseURL: websiteUrl,
      plugins: [deviceAuthorizationClient()],
    })

    if (ctx.daemon.isDaemon) {
      // ── BACKGROUND DAEMON: poll until the user approves in the browser ──
      const deviceCode = process.env.AKARSO_DEVICE_CODE
      if (!deviceCode) {
        console.error('Missing AKARSO_DEVICE_CODE for login daemon')
        process.exit(1)
        return
      }
      const pollInterval = Number(process.env.AKARSO_POLL_INTERVAL || 5) * 1000
      const deadline = Date.now() + 10 * 60 * 1000

      while (Date.now() < deadline) {
        await new Promise((r) => { setTimeout(r, pollInterval) })
        const { data: tokenData, error: pollError } = await client.device.token({
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          device_code: deviceCode,
          client_id: 'akarso-cli',
        })
        if (tokenData?.access_token) {
          await exchangeTokenForApiKey({
            accessToken: tokenData.access_token,
            websiteUrl,
            fs,
            env: process.env,
            console,
          })
          return // daemon exits, PID file is cleaned up
        }
        const errorCode = pollError?.error
        if (errorCode === 'authorization_pending' || errorCode === 'slow_down') continue
        if (pollError) return // unrecoverable error, exit
      }
      return
    }

    // ── FOREGROUND CLIENT ──
    // Capture the key saved before this login so the wait loop below only
    // succeeds on a *fresh* key, not a stale one from a previous login.
    const previousKey = (await getServerConfig({ fs, env: process.env })).apiKey

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

    await openInBrowser(verificationUrl)

    // Start a detached daemon that re-runs this command and polls for
    // approval, so this process can return control to the user or agent.
    await ctx.daemon.start({
      timeoutMs: 10 * 60 * 1000,
      env: {
        AKARSO_DEVICE_CODE: data.device_code,
        AKARSO_POLL_INTERVAL: String(data.interval || 5),
      },
    })

    if (isAgent) {
      console.error('Login running in background.')
      console.error('After approving in the browser, verify with: akarso auth check')
      return
    }

    // Interactive: wait until the daemon saves a fresh API key.
    console.error('Waiting for approval...')
    const deadline = Date.now() + (data.expires_in || 300) * 1000
    while (Date.now() < deadline) {
      const server = await getServerConfig({ fs, env: process.env })
      if (server.apiKey && server.apiKey !== previousKey) {
        console.error(dedent`

          Logged in successfully! API key saved to ~/.akarso/config.json

          You can now use the CLI:
            akarso accounts list
            akarso posts create --text "Hello!" --accounts twitter --publish-now
        `)
        return
      }
      await new Promise((r) => { setTimeout(r, 2000) })
    }
    console.error('Device authorization timed out. Try again.')
    process.exit(1)
  })

auth
  .command('auth set', 'Save API key manually (pass it with `--key`)')
  .option('--key <key>', z.string().describe('Your API key'))
  .action(async (options, { fs, console, process }) => {
    await setServerConfig({ fs, env: process.env, data: { apiKey: options.key } })
    console.error('API key saved to ~/.akarso/config.json')
  })

auth
  .command('auth check', 'Verify API key is valid (exits 1 if not logged in)')
  .action(async (options, ctx) => {
    const { fs, console, process } = ctx
    // A login daemon still waiting for browser approval means the saved key
    // (if any) is about to be replaced — report "in progress" instead of
    // validating a stale key. Skip this when a key is passed explicitly.
    const loginDaemon = ctx.daemon.forCommand('auth login')
    if (!options.apiKey && await loginDaemon.isRunning()) {
      console.error('Login in progress. Approve in the browser first, then re-run `akarso auth check`.')
      process.exit(1)
      return
    }
    try {
      const client = await createClient({
        apiKey: options.apiKey,
        fs,
        env: process.env,
      })
      const data = await client('/api/v1/profiles')
      if (data instanceof Error) {
        throw new Error(`API returned error: ${data.message}`)
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
  .command('auth logout', 'Clear saved credentials for the current server')
  .action(async (_options, ctx) => {
    const { fs, console, process } = ctx
    // Stop any login daemon still polling for approval
    const loginDaemon = ctx.daemon.forCommand('auth login')
    await loginDaemon.stop()

    await deleteServerConfig({ fs, env: process.env })
    console.error(`Logged out from ${resolveBaseUrl(process.env)}`)
  })

auth
  .command('subscribe', 'Open the dashboard to subscribe or manage your plan')
  .action(async (_options, { console, process }) => {
    const websiteUrl = resolveBaseUrl(process.env)
    const subscribeUrl = `${websiteUrl}/dashboard`
    console.error('Opening your browser to manage your subscription:')
    console.error(`  ${subscribeUrl}`)
    console.error('')
    await openInBrowser(subscribeUrl)
  })

export default auth
