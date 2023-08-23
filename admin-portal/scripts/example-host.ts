import { createSessionUrl } from 'admin-portal/../website/src/lib/ssr-edge'
import { prisma } from 'db/prisma'
import { DEMO_SITE_SECRET, env } from 'db/env'

async function main() {
    const secret = DEMO_SITE_SECRET

    const { url } = await createSessionUrl({
        callbackUrl: env.NEXT_PUBLIC_URL,
        identifier: '',
        secret,
    })
    console.log(`example url:`, url)
}

main()
