#!/usr/bin/env node
import { goke } from 'goke'
import { z } from 'zod'
import { createRequire } from 'node:module'
import auth from './commands/auth.ts'
import profiles from './commands/profiles.ts'
import accounts from './commands/accounts.ts'
import posts from './commands/posts.ts'
import media from './commands/media.ts'
import inbox from './commands/inbox.ts'

const require = createRequire(import.meta.url)
const packageJson = require('../package.json') as { version: string }

const cli = goke('akarso')

// Global options available on every command
cli
  .option(
    '--api-key [key]',
    z
      .string()
      .describe(
        'API key (overrides ZERNIO_API_KEY env and ~/.akarso/config.json)',
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
cli.version(packageJson.version)
cli.parse()
