import { Zernio } from '@zernio/node'
import type { GokeFs } from 'goke'
import path from 'node:path'
import os from 'node:os'

const CONFIG_DIR = path.join(os.homedir(), '.akarso')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')

/** Default base URL for the Akarso proxy API. The CLI sends all requests
 *  here instead of directly to the upstream provider. */
const DEFAULT_BASE_URL = 'https://akarso.co/api/v1'

export interface AkarsoConfig {
  apiKey?: string
}

export async function loadConfig(fs: GokeFs): Promise<AkarsoConfig> {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf8')
    return JSON.parse(String(raw)) as AkarsoConfig
  } catch {
    return {}
  }
}

export async function saveConfig(
  fs: GokeFs,
  config: AkarsoConfig,
): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true })
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8')
}

/**
 * Resolve the API key from (in priority order):
 * 1. --api-key flag
 * 2. AKARSO_API_KEY env
 * 3. ZERNIO_API_KEY env (backwards compat)
 * 4. ~/.akarso/config.json
 */
export async function resolveApiKey(opts: {
  apiKey?: string
  fs: GokeFs
  env: Record<string, string | undefined>
}): Promise<string | undefined> {
  if (opts.apiKey) return opts.apiKey
  if (opts.env.AKARSO_API_KEY) return opts.env.AKARSO_API_KEY
  if (opts.env.ZERNIO_API_KEY) return opts.env.ZERNIO_API_KEY
  const config = await loadConfig(opts.fs)
  return config.apiKey
}

/** Resolve the proxy base URL. */
export function resolveBaseUrl(env: Record<string, string | undefined>): string {
  return env.AKARSO_API_URL || env.ZERNIO_API_URL || DEFAULT_BASE_URL
}

/** Create an API client, throwing if no API key is found.
 *  Points at the Akarso proxy by default, which forwards to the upstream API
 *  with our master key and the user's profile injected. */
export async function createClient(opts: {
  apiKey?: string
  fs: GokeFs
  env: Record<string, string | undefined>
}): Promise<InstanceType<typeof Zernio>> {
  const apiKey = await resolveApiKey(opts)
  if (!apiKey) {
    throw new Error(
      'No API key found. Run `akarso auth login` or `akarso auth set --key <key>` first.',
    )
  }
  return new Zernio({
    apiKey,
    baseURL: resolveBaseUrl(opts.env),
    // The proxy authenticates via x-api-key header which @zernio/node sends automatically
  })
}
