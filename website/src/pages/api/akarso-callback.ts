import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { createLoginRedirectUrl } from 'website/src/lib/utils'
import { KnownError } from 'website/src/lib/errors'
import { prisma } from 'db/prisma'
import { notifyError } from 'website/src/lib/sentry'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from 'db/supabase'
import { env } from 'db/env'
import { createSessionUrl } from 'website/src/lib/ssr-edge'
import { getAkarsoCallbackResult } from 'akarso'

export const config = {
    runtime: 'edge',
}

const handler = async (req: NextRequest) => {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) {
        return NextResponse.json('token missing from query', {
            status: 400,
        })
    }
    try {
        const { ssoProviderId, domain, identifier, metadata } =
            await getAkarsoCallbackResult({
                secret: env.AKARSO_SECRET,
                token,
            })
        console.log(
            `received akarso callback for ${identifier}: registered ${domain} with provider id ${ssoProviderId}`,
        )
        const { slug } = metadata || {}
        if (!slug) {
            throw new KnownError(`slug is missing`)
        }
        const org = await prisma.org.findUnique({
            where: {
                orgId: identifier,
            },
        })
        if (!org) {
            throw new KnownError(`org not found`)
        }
        await prisma.org.update({
            where: {
                orgId: identifier,
            },
            data: {
                ssoProviderId,
            },
        })

        return NextResponse.redirect(
            `${env.NEXT_PUBLIC_URL}/org/${org.orgId}/site/${slug}`,
        )
    } catch (error: any) {
        notifyError(error, 'get-session API')
        return NextResponse.json(error.message, {
            status: 500,
        })
    }
}

export default handler
