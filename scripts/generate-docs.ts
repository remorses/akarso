// Generates CLI reference markdown pages from goke command definitions.
// Output goes to ../website/src/pages/docs/cli/ for holocron to render.
// Prepends holocron-compatible frontmatter (title, sidebarTitle, description).
import { generateDocs } from 'goke'
import fs from 'node:fs'
import path from 'node:path'
import { cli } from '../src/cli.ts'

const outDir = path.resolve(import.meta.dirname, '../../website/src/pages/docs/cli')

fs.mkdirSync(outDir, { recursive: true })

const pages = generateDocs({ cli })

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

  const filePath = path.join(outDir, `${page.slug}.md`)
  fs.writeFileSync(filePath, frontmatter + contentWithoutFirstHeading)
  console.log(`wrote ${filePath}`)
}

console.log(`\nGenerated ${pages.length} CLI doc pages in ${outDir}`)
