import inspector from 'inspector'
import { uploadDirect } from '@uploadcare/upload-client'

import path from 'path'
import type { VercelRequest, VercelResponse } from '@vercel/node'

if (process.env.DEV) {
    require('../.next/standalone/website/.next/server/pages/org/[orgId]/site/[slug]/customize.js')
}

export default async function handler(
    request: VercelRequest,
    response: VercelResponse,
) {
    const session = new inspector.Session()
    session.connect()

    const result = await new Promise((resolve, reject) => {
        session.post('Profiler.enable', () => {
            // Start profiling
            session.post('Profiler.start', async () => {
                // Run your Node.js program or perform the operations you want to profile
                console.time('cold start')
                const requireDebug = false
                const page =
                    await require('../.next/standalone/website/.next/server/pages/org/[orgId]/site/[slug]/customize.js')
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
                    if (err) {
                        console.error(err)
                        reject(err)
                        return
                    }
                    // Save the profile to a file
                    const profileData = JSON.stringify(profile)
                    // fs.writeFileSync('cold-start.cpuprofile', profileData)
                    // Disconnect the inspector session
                    session.disconnect()
                    const result = await uploadDirect(
                        Buffer.from(profileData),
                        {
                            publicKey: '880c755228f5ed9be9dc',
                            fileName: 'cold-start.cpuprofile',
                            store: 'auto',
                        },
                    )
                    resolve(result)
                    console.log(profileData)
                })
            })
        })
        response.end(result)
    })
}
