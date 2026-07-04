// Generates CLI reference markdown pages from goke command definitions.
// Output goes to ../website/src/pages/docs/cli/ for holocron to render.
// Prepends holocron-compatible frontmatter (title, sidebarTitle, description).
//
// Also generates ../website/mcp-tools.json — the MCP tool definitions that
// power the holocron MCP docs tab. Tools are extracted by mounting the same
// @goke/mcp adapter used by the /mcp endpoint on an in-memory server, so
// the docs always match production behavior exactly.
import { generateDocs } from 'goke'
import fs from 'node:fs'
import path from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { addCliToolsToMcp } from '@goke/mcp'
import { createRequire } from 'node:module'
import dedent from 'string-dedent'
import { createCli, isRemoteMcpCommand } from '../src/create-cli.ts'

const require = createRequire(import.meta.url)
const packageJson = require('../package.json') as { version: string }

const cli = createCli({ version: packageJson.version })

// ── CLI reference markdown pages ────────────────────────────────────

const outDir = path.resolve(import.meta.dirname, '../../website/src/pages/docs/cli')

fs.mkdirSync(outDir, { recursive: true })

const pages = generateDocs({ cli })

// Intro section prepended to the index page only. Covers installation,
// the agent skill, and MCP usage so the CLI reference landing page is
// useful on its own without jumping to the quickstart first.
const indexIntro = dedent`
  ## Install

  ${'```'}sh
  npm install -g akarso
  akarso auth login
  ${'```'}

  This opens your browser for sign-in (device flow, safe for agents) and saves an API key to \`~/.akarso/config.json\`. Verify with \`akarso auth check\`.

  API keys are scoped to one organization and one profile. Commands using that key publish from the pinned profile's connected accounts. Override the profile per-command with \`--profile\`:

  ${'```'}sh
  # List profiles to find their IDs
  akarso profiles list

  # Post from a specific profile
  akarso posts create --text "Hello!" --platforms x --publish-now --profile 01JXYZ...
  ${'```'}

  For CI or headless environments, set the key directly:

  ${'```'}sh
  akarso auth set --key ak_your_key_here
  # or use the env var
  export AKARSO_API_KEY=ak_your_key_here
  ${'```'}

  ## Use with AI agents

  ### Skill

  Akarso ships with a **skill** that teaches any compatible AI agent (Claude Code, Cursor, Kimaki, OpenCode, etc.) how to use the CLI. Install it so agents can post, schedule, and manage social accounts without extra prompting:

  ${'```'}sh
  kimaki skill install remorses/akarso
  ${'```'}

  Once installed, the agent loads the skill automatically when you ask it to post to social media, schedule content, or manage accounts.

  ### MCP server

  Akarso can also run as an [MCP server](/docs/mcp), exposing every command as a tool that MCP-compatible agents can call directly:

  ${'```'}sh
  # Local stdio server (can upload local files)
  akarso mcp

  # Or use the hosted server (no install, OAuth sign-in)
  claude mcp add --transport http akarso https://akarso.co/mcp
  ${'```'}

  ### Output format

  All structured data goes to **stdout as YAML**, pipeable through \`yq\`. Pass \`--json\` for raw JSON (pipeable through \`jq\`). Progress and errors go to **stderr**, so agents can parse stdout cleanly.

  ${'```'}sh
  akarso posts list --json | jq '.[0].id'
  akarso accounts list | yq '.[].type'
  ${'```'}

`

for (const page of pages) {
  const isIndex = page.slug === 'index'
  const title = isIndex ? 'CLI command reference' : `akarso ${page.command}`
  const sidebarTitle = isIndex ? 'Overview' : page.command
  const description = isIndex
    ? 'Full reference for every akarso CLI command, option, and argument.'
    : `CLI reference for akarso ${page.command}.`

  // Prepend frontmatter. The generated content already starts with a # heading
  // which holocron renders separately from the frontmatter title, so we strip
  // the first heading line to avoid duplication.
  const contentWithoutFirstHeading = page.content.replace(/^# .+\n+/, '')
  const frontmatter = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `sidebarTitle: ${JSON.stringify(sidebarTitle)}`,
    `description: ${JSON.stringify(description)}`,
    '---',
    '',
  ].join('\n')

  // For the index page, insert the intro section between frontmatter and the
  // generated command table so readers see install/agent info first.
  const body = isIndex
    ? indexIntro + contentWithoutFirstHeading
    : contentWithoutFirstHeading

  const filePath = path.join(outDir, `${page.slug}.md`)
  fs.writeFileSync(filePath, frontmatter + body)
  console.log(`wrote ${filePath}`)
}

console.log(`\nGenerated ${pages.length} CLI doc pages in ${outDir}`)

// ── MCP tool definitions for the docs MCP tab ───────────────────────

async function generateMcpToolsJson() {
  const server = new Server({ name: 'akarso', version: '1.0.0' }, { capabilities: {} })
  addCliToolsToMcp({ cli, server, commandFilter: isRemoteMcpCommand })

  const client = new Client({ name: 'docs-generator', version: '1.0.0' })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  await server.connect(serverTransport)
  await client.connect(clientTransport)

  const { tools } = await client.listTools()
  await client.close()
  await server.close()

  const outFile = path.resolve(import.meta.dirname, '../../website/mcp-tools.json')
  const definition = {
    serverUrl: 'https://akarso.co/mcp',
    tools,
  }
  fs.writeFileSync(outFile, JSON.stringify(definition, null, 2) + '\n')
  console.log(`wrote ${outFile} (${tools.length} tools)`)
}

await generateMcpToolsJson()
