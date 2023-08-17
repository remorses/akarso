import path from 'path'
const require = createRequire(import.meta.url)
import inspector from 'inspector'

import fs from 'fs'
import { build } from 'esbuild'
import { execSync } from 'child_process'
import { createRequire } from 'module'

function profileRequire() {
    // import requireSoSlow from 'require-so-slow'
    require('../.next/server/pages/org/[orgId]/site/[slug]/customize.js')

    requireSoSlow.write('require-trace.trace')
}

// slow()
// process.exit(0)

const p = path.resolve(
    '../',
    `website/.next/server/pages/org/[orgId]/site/[slug]/customize.js`,
)

async function bundle() {
    const outfile = 'dist/page_bundle.js'
    await build({
        entryPoints: [p.replace('website/', '')],
        bundle: true,
        minify: true,
        treeShaking: true,
        format: 'cjs',
        platform: 'node',
        sourcemap: false,
        outfile,
    })
    // size of bundle in MB
    const stats = fs.statSync(outfile)
    const fileSizeInBytes = stats.size
    console.log(`Bundle size: ${fileSizeInBytes / 1000000} MB`)
}

function coldStart2() {
    console.time('cold start')
    const requireDebug = false
    const cmd = `node ${requireDebug ? '--require time-require' : ''} ${p}`
    console.log('doppler run -c dev --' + cmd)
    execSync(cmd, {
        stdio: 'inherit',

        env: { ...process.env, NEXT_CPU_PROF: '1', NODE_ENV: 'production' },
    })
    // execSync(`bun ${p}`, { stdio: 'inherit' })
    console.timeEnd('cold start')
}
async function coldStart() {
    const session = new inspector.Session()
    session.connect()

    session.post('Profiler.enable', () => {
        // Start profiling
        session.post('Profiler.start', async () => {
            // Run your Node.js program or perform the operations you want to profile
            console.time('cold start')
            const requireDebug = false
            const page = await require(p)
            console.log(page)
            const appRender = page.routeModule.components.App({})
            const pageRender = page.routeModule.userland.default({})
            const res = await page.getServerSideProps({
                req: { headers: {}, cookies: {} },
                query: {},
                res: {
                    getHeader() {
                        return
                    },
                },
            })
            console.log(res)
            // execSync(`bun ${p}`, { stdio: 'inherit' })
            console.timeEnd('cold start')
            // Stop profiling
            session.post('Profiler.stop', async (err, { profile }) => {
                // Save the profile to a file
                const profileData = JSON.stringify(profile)
                fs.writeFileSync('cold-start.cpuprofile', profileData)

                // Disconnect the inspector session
                session.disconnect()
            })
        })
    })
}
coldStart()

// coldStart2()

// bundle()


