#!/usr/bin/env node
import { goke } from 'goke'
import { z } from 'zod'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import auth from './commands/auth.ts'
import profiles from './commands/profiles.ts'
import accounts from './commands/accounts.ts'
import posts from './commands/posts.ts'
import media from './commands/media.ts'
import inbox from './commands/inbox.ts'

const require = createRequire(import.meta.url)
const packageJson = require('../package.json') as { version: string }

export const cli = goke('akarso')

// Global options available on every command
cli
  .option(
    '--api-key [key]',
    z
      .string()
      .describe(
        'API key (overrides AKARSO_API_KEY env and ~/.akarso/config.json)',
      ),
  )
  .option('--json', 'Output raw JSON instead of YAML')

// Compose all command groups
cli.use(auth)
cli.use(profiles)
cli.use(accounts)
cli.use(posts)
cli.use(media)
cli.use(inbox)

cli.help()
cli.completions()
cli.version(packageJson.version)

// Only parse when run directly (not when imported for docs generation).
// Uses realpathSync to handle symlinks (e.g. after npm install -g).
function isDirectRun() {
  if (!process.argv[1]) return false
  try {
    return fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))
  } catch {
    return false
  }
}

if (isDirectRun()) {
  void cli.parse()
}
