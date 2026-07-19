import { type SpiceflowFetch } from 'spiceflow/client';
import type { ProxyApp } from 'akarso-website/src/proxy-api.ts';
import type { GokeFs } from 'goke';
/** Default base URL for the Akarso API and website. Routes live under
 *  /api/v1/, which is part of each request path (not the base URL). */
export declare const DEFAULT_BASE_URL = "https://akarso.co";
export type AkarsoClient = SpiceflowFetch<ProxyApp>;
export interface ServerConfig {
    apiKey?: string;
}
/** Config file shape: keyed by API URL so multiple servers can be logged in
 *  at the same time (production, preview, localhost). */
export type AkarsoConfig = Record<string, ServerConfig>;
export declare function loadConfig({ fs }: {
    fs: GokeFs;
}): Promise<AkarsoConfig>;
export declare function getServerConfig({ fs, env, }: {
    fs: GokeFs;
    env: Record<string, string | undefined>;
}): Promise<ServerConfig>;
export declare function setServerConfig({ fs, env, data, }: {
    fs: GokeFs;
    env: Record<string, string | undefined>;
    data: ServerConfig;
}): Promise<void>;
/** Remove the config entry for the current API URL (used by `auth logout`). */
export declare function deleteServerConfig({ fs, env, }: {
    fs: GokeFs;
    env: Record<string, string | undefined>;
}): Promise<void>;
/**
 * Resolve the API key from (in priority order):
 * 1. --api-key flag
 * 2. AKARSO_API_KEY env
 * 3. ~/.akarso/config.json entry for the current API URL
 */
export declare function resolveApiKey(opts: {
    apiKey?: string;
    fs: GokeFs;
    env: Record<string, string | undefined>;
}): Promise<string | undefined>;
/** Resolve the server base URL (website root, no /api suffix). The global
 *  `--api-url` middleware in create-cli.ts writes the resolved URL back into
 *  process.env.AKARSO_API_URL, so this works both for flags and env vars.
 *  Trailing slashes are stripped so config keys stay consistent. */
export declare function resolveBaseUrl(env: Record<string, string | undefined>): string;
/** Create a typed API client, throwing if no API key is found.
 *  Points at the Akarso proxy, which forwards to the upstream API with our
 *  master key and the user's profile injected. When --profile is set
 *  (AKARSO_PROFILE_ID env), the x-akarso-profile-id header overrides the
 *  API key's pinned profile on the server side. */
export declare function createClient(opts: {
    apiKey?: string;
    fs: GokeFs;
    env: Record<string, string | undefined>;
}): Promise<AkarsoClient>;
//# sourceMappingURL=client.d.ts.map