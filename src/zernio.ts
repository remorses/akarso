// Akarso API client factory and CLI config storage.
// Config lives at ~/.akarso/config.json and is keyed by API URL so users can
// stay logged in to production, preview, and localhost servers simultaneously.
import { Zernio } from '@zernio/node'
import type { GokeFs } from 'goke'
import path from 'node:path'
import os from 'node:os'

const CONFIG_DIR = path.join(os.homedir(), '.akarso')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')

/** Default base URL for the Akarso proxy API. The CLI sends all requests
 *  here instead of directly to the upstream provider.
 *  The @zernio/node SDK appends /v1/... paths, so this must NOT include /v1. */
export const DEFAULT_BASE_URL = 'https://akarso.co/api'

export interface ServerConfig {
  apiKey?: string
}

/** Config file shape: keyed by API URL so multiple servers can be logged in
 *  at the same time (production, preview, localhost). */
export type AkarsoConfig = Record<string, ServerConfig>

export async function loadConfig({ fs }: { fs: GokeFs }): Promise<AkarsoConfig> {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf8')
    return JSON.parse(String(raw)) as AkarsoConfig
  } catch {
    return {}
  }
}

async function saveConfig({
  fs,
  config,
}: {
  fs: GokeFs
  config: AkarsoConfig
}): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true })
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n', 'utf8')
}

export async function getServerConfig({
  fs,
  env,
}: {
  fs: GokeFs
  env: Record<string, string | undefined>
}): Promise<ServerConfig> {
  const config = await loadConfig({ fs })
  return config[resolveBaseUrl(env)] ?? {}
}

export async function setServerConfig({
  fs,
  env,
  data,
}: {
  fs: GokeFs
  env: Record<string, string | undefined>
  data: ServerConfig
}): Promise<void> {
  const apiUrl = resolveBaseUrl(env)
  const config = await loadConfig({ fs })
  config[apiUrl] = { ...config[apiUrl], ...data }
  await saveConfig({ fs, config })
}

/**
 * Resolve the API key from (in priority order):
 * 1. --api-key flag
 * 2. AKARSO_API_KEY env
 * 3. ~/.akarso/config.json entry for the current API URL
 */
export async function resolveApiKey(opts: {
  apiKey?: string
  fs: GokeFs
  env: Record<string, string | undefined>
}): Promise<string | undefined> {
  if (opts.apiKey) return opts.apiKey
  if (opts.env.AKARSO_API_KEY) return opts.env.AKARSO_API_KEY
  const server = await getServerConfig({ fs: opts.fs, env: opts.env })
  return server.apiKey
}

/** Resolve the proxy base URL. The global `--api-url` middleware in cli.ts
 *  writes the resolved URL back into process.env.AKARSO_API_URL, so this
 *  works both for flags and env vars. Trailing slashes are stripped so
 *  config keys stay consistent. */
export function resolveBaseUrl(env: Record<string, string | undefined>): string {
  return (env.AKARSO_API_URL || DEFAULT_BASE_URL).replace(/\/+$/, '')
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
