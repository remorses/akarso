import inspector from 'inspector'

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
                    const pageName = 'customize'
                    const filename = `${pageName}-cold-start.cpuprofile`
                    res.setHeader(
                        'Content-Disposition',
                        `attachment; filename="${filename}"`,
                    )
                    res.setHeader('Content-Type', 'application/json')

                    res.end(profileData)
                    // Pipe the file stream to the response

                    resolve(profileData)
                    // console.log(profileData)
                })
            })
        })
        // response.end(result)
    })
}
