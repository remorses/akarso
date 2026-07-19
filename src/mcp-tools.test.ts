// Locks the MCP tool surface: which commands are exposed locally vs on the
// remote endpoint. Renaming a CLI command or changing the exclusion lists
// shows up here as a snapshot diff.
import { describe, expect, test } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { addCliToolsToMcp } from '@goke/mcp'
import { createCli, isRemoteMcpCommand } from './create-cli.ts'

async function listToolNames(commandFilter?: (name: string) => boolean) {
  const cli = createCli()
  const server = new Server({ name: 'akarso', version: '0.0.0' }, { capabilities: {} })
  addCliToolsToMcp({ cli, server, commandFilter })

  const client = new Client({ name: 'test', version: '0.0.0' })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  await server.connect(serverTransport)
  await client.connect(clientTransport)
  const { tools } = await client.listTools()
  await client.close()
  await server.close()
  return tools.map((tool) => tool.name)
}

describe('MCP tool surface', () => {
  test('remote endpoint tools (akarso.co/mcp)', async () => {
    expect(await listToolNames(isRemoteMcpCommand)).toMatchInlineSnapshot(`
      [
        "profiles_list",
        "profiles_create",
        "profiles_rename",
        "accounts_list",
        "accounts_get",
        "accounts_health",
        "accounts_disconnect",
        "accounts_set-channel",
        "posts_create",
        "posts_list",
        "posts_get",
        "posts_delete",
        "posts_retry",
        "media_upload",
        "inbox_sync",
        "inbox_syncs",
        "inbox_comments",
        "inbox_reply",
        "inbox_comment-action",
        "inbox_reviews",
        "inbox_reviews-sync",
        "inbox_review-reply",
      ]
    `)
  })

  test('remote excludes local-machine and interactive commands', async () => {
    const names = await listToolNames(isRemoteMcpCommand)
    for (const excluded of ['auth_login', 'auth_set', 'auth_check', 'auth_logout', 'subscribe', 'accounts_connect', 'mcp']) {
      expect(names).not.toContain(excluded)
    }
    // media upload stays remote: it accepts https URLs; local paths are
    // rejected at runtime via AKARSO_REMOTE_MCP.
    expect(names).toContain('media_upload')
  })
})
