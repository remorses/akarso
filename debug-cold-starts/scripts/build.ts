import fs from 'fs'
import extra from 'fs-extra'

import { shell } from '@xmorse/deployment-utils/src'
import path from 'path'

async function main() {
    await shell(`pnpm --filter website vercel-build `)
    
    await extra.copy('../website/.next', './.next', {
        overwrite: true,
        dereference: true,
    })
    // await shell(`cp -fr ../node_modules/caniuse-lite `)
    // await shell(`cp -r ../website/.next ./.next`).catch(() => {
    //     console.log('cp failed')
    //     return null
    // })
    // https://github.com/vercel/next.js/issues/50072
    console.log('build done')
}

main()
