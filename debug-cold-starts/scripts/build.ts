import { shell } from '@xmorse/deployment-utils/src'

async function main() {
    await shell(`pnpm --filter website vercel-build `)
    await shell(`cp -r ../website/.next ./.next`).catch(() => {
        console.log('cp failed')
        return null
    })
    console.log('build done')
}

main()
