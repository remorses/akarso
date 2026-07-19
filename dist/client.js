// Akarso API client factory and CLI config storage.
// The client is a spiceflow typed fetch client bound to the proxy app type
// exported by the website (type-only import, no runtime dependency), so every
// path, query param, body, and response is typed end-to-end from the server
// route definitions. Calls return `Error | Data`; check with `instanceof Error`.
// Config lives at ~/.akarso/config.json and is keyed by API URL so users can
// stay logged in to production, preview, and localhost servers simultaneously.
import { createSpiceflowFetch } from 'spiceflow/client';
import path from 'node:path';
import os from 'node:os';
const CONFIG_DIR = path.join(os.homedir(), '.akarso');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
/** Default base URL for the Akarso API and website. Routes live under
 *  /api/v1/, which is part of each request path (not the base URL). */
export const DEFAULT_BASE_URL = 'https://akarso.co';
export async function loadConfig({ fs }) {
    try {
        const raw = await fs.readFile(CONFIG_FILE, 'utf8');
        return JSON.parse(String(raw));
    }
    catch {
        return {};
    }
}
async function saveConfig({ fs, config, }) {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n', 'utf8');
}
export async function getServerConfig({ fs, env, }) {
    const config = await loadConfig({ fs });
    return config[resolveBaseUrl(env)] ?? {};
}
export async function setServerConfig({ fs, env, data, }) {
    const apiUrl = resolveBaseUrl(env);
    const config = await loadConfig({ fs });
    config[apiUrl] = { ...config[apiUrl], ...data };
    await saveConfig({ fs, config });
}
/** Remove the config entry for the current API URL (used by `auth logout`). */
export async function deleteServerConfig({ fs, env, }) {
    const config = await loadConfig({ fs });
    delete config[resolveBaseUrl(env)];
    await saveConfig({ fs, config });
}
/**
 * Resolve the API key from (in priority order):
 * 1. --api-key flag
 * 2. AKARSO_API_KEY env
 * 3. ~/.akarso/config.json entry for the current API URL
 */
export async function resolveApiKey(opts) {
    if (opts.apiKey)
        return opts.apiKey;
    if (opts.env.AKARSO_API_KEY)
        return opts.env.AKARSO_API_KEY;
    const server = await getServerConfig({ fs: opts.fs, env: opts.env });
    return server.apiKey;
}
/** Resolve the server base URL (website root, no /api suffix). The global
 *  `--api-url` middleware in create-cli.ts writes the resolved URL back into
 *  process.env.AKARSO_API_URL, so this works both for flags and env vars.
 *  Trailing slashes are stripped so config keys stay consistent. */
export function resolveBaseUrl(env) {
    return (env.AKARSO_API_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
}
/** Create a typed API client, throwing if no API key is found.
 *  Points at the Akarso proxy, which forwards to the upstream API with our
 *  master key and the user's profile injected. When --profile is set
 *  (AKARSO_PROFILE_ID env), the x-akarso-profile-id header overrides the
 *  API key's pinned profile on the server side. */
export async function createClient(opts) {
    const apiKey = await resolveApiKey(opts);
    if (!apiKey) {
        throw new Error('No API key found. Run `akarso auth login` or `akarso auth set --key <key>` first.');
    }
    // Real API keys are prefixed `ak_` and go in x-api-key. When login could
    // not create an API key it saves the device-flow session token as a
    // fallback, which the server only accepts as a bearer credential.
    const headers = apiKey.startsWith('ak_')
        ? { 'x-api-key': apiKey }
        : { Authorization: `Bearer ${apiKey}` };
    // --profile flag (or AKARSO_PROFILE_ID env) overrides the key's pinned
    // profile, letting one key operate on any profile in the same org.
    const profileId = opts.env.AKARSO_PROFILE_ID;
    if (profileId) {
        headers['x-akarso-profile-id'] = profileId;
    }
    return createSpiceflowFetch(resolveBaseUrl(opts.env), { headers });
}
