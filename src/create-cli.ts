// CLI composition root. Builds the full akarso goke instance so the same
// command definitions power three surfaces:
//   1. the `akarso` binary (cli.ts parses argv)
//   2. the local stdio MCP server (`akarso mcp`, via @goke/mcp createMcpAction)
//   3. the remote multi-tenant MCP endpoint on akarso.co (website clones this
//      cli per request with tenant env; see website/src/mcp.ts)
// Keep this file free of top-level Node-only side effects (no fs reads, no
// createRequire) so it can be imported from Cloudflare Workers.
import { goke } from 'goke'
import { z } from 'zod'
import dedent from 'string-dedent'
import { createMcpAction } from '@goke/mcp'
import { DEFAULT_BASE_URL } from './client.ts'
import auth from './commands/auth.ts'
import profiles from './commands/profiles.ts'
import accounts from './commands/accounts.ts'
import posts from './commands/posts.ts'
import media from './commands/media.ts'

/** Commands that never make sense as MCP tools, local or remote:
 *  interactive browser flows and shell-integration helpers. */
const MCP_EXCLUDED_COMMANDS = new Set([
  'auth login', // device flow: opens browser, long polling
  'subscribe', // opens browser to the dashboard
])

/** Additional exclusions for the remote (hosted) MCP endpoint. These
 *  commands touch the local machine (files, config, browser) which does
 *  not exist server-side. */
const MCP_REMOTE_EXCLUDED_COMMANDS = new Set([
  ...MCP_EXCLUDED_COMMANDS,
  'auth set', // writes ~/.akarso/config.json on the user's machine
  'auth check', // reads local config; remote auth is the OAuth token itself
  'auth logout', // clears ~/.akarso/config.json on the user's machine
  // media upload IS exposed remotely: it accepts https URLs. Local paths
  // are rejected server-side via the AKARSO_REMOTE_MCP env check in
  // commands/media.ts (set by website/src/mcp.ts on each tenant clone).
  'accounts connect', // opens a browser; remote users connect via dashboard
  'mcp', // the MCP server command itself
])

/** Filter for exposing commands as MCP tools on the remote endpoint. */
export function isRemoteMcpCommand(name: string): boolean {
  if (MCP_REMOTE_EXCLUDED_COMMANDS.has(name)) return false
  if (name.startsWith('completions')) return false
  return true
}

/** Filter for the local stdio MCP server (`akarso mcp`). The mcp command
 *  itself is auto-excluded by createMcpAction. */
function isLocalMcpCommand(name: string): boolean {
  if (MCP_EXCLUDED_COMMANDS.has(name)) return false
  if (name.startsWith('completions')) return false
  return true
}

export function createCli({ version }: { version?: string } = {}) {
  // Global options available on every command. The chain must stay in one
  // expression so the option types accumulate and the middleware sees them.
  const cli = goke('akarso')
    .option(
      '--api-key [key]',
      z
        .string()
        .describe(
          'API key (overrides AKARSO_API_KEY env and ~/.akarso/config.json)',
        ),
    )
    .option(
      '--api-url [url]',
      z
        .string()
        .describe('Server URL (overrides AKARSO_API_URL env, defaults to akarso.co)'),
    )
    .option(
      '--profile [id]',
      z
        .string()
        .describe(
          'Profile (workspace) ID to operate on, overriding the API key\'s pinned profile. Use `profiles list` to see available IDs.',
        ),
    )
    .option('--json', 'Output raw JSON instead of YAML')
    // Resolve the API URL and profile once and write them back to process.env
    // so all code (config helpers, client factory) reads a single source of
    // truth instead of threading options through every command.
    .use((options, { process }) => {
      const apiUrl = (options.apiUrl || process.env.AKARSO_API_URL || DEFAULT_BASE_URL)
        .replace(/\/+$/, '')
      process.env.AKARSO_API_URL = apiUrl
      // Set or clear so a previous MCP tool call's --profile does not
      // leak into the next call that omits it.
      if (options.profile) {
        process.env.AKARSO_PROFILE_ID = options.profile
      } else {
        delete process.env.AKARSO_PROFILE_ID
      }
    })

  // Compose all command groups
  cli.use(auth)
  cli.use(profiles)
  cli.use(accounts)
  cli.use(posts)
  cli.use(media)

  // Expose the CLI as an MCP server over stdio. Every command becomes an
  // MCP tool with a typed input schema derived from the Zod options.
  cli
    .command(
      'mcp',
      dedent`
        Start Akarso as a local MCP (Model Context Protocol) server over stdio.

        Exposes all commands as MCP tools with typed input schemas. AI agents (Claude, Cursor, etc.) can connect to this server to manage social media accounts, create posts, and upload media programmatically.

        Install into your MCP client with: \`npx @playwriter/install-mcp 'akarso mcp' --client claude-code\`

        The local server can read local files (for \`media upload\` with file paths) and access saved credentials. For a hosted version that does not require local setup, see the remote MCP endpoint at \`akarso.co/mcp\`.
      `,
    )
    .example('akarso mcp')
    .example("npx @playwriter/install-mcp 'akarso mcp' --client claude-code")
    .action(
      createMcpAction({
        cli,
        commandFilter: isLocalMcpCommand,
        serverName: 'akarso',
        serverVersion: version,
      }),
    )

  cli.help()
  cli.completions()
  if (version) cli.version(version)

  return cli
}
