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

export const config = {
    runtime: 'edge',
}

const handler = async (req: NextRequest) => {
    if (req.method !== 'POST') {
        return NextResponse.json('Method Not Allowed', {
            status: 405,
        })
    }
    try {
        const {
            secret,
            callbackUrl,
            identifier,
            slug,
            metadata = {},
        } = await req.json()

        const data = await createSessionUrl({
            secret,
            callbackUrl,
            identifier,
            metadata,
        })

        return NextResponse.json({
            // TODO wait for customDomain to be valid first
            ...data,
        })
    } catch (error: any) {
        notifyError(error, 'get-session API')
        return NextResponse.json(error.message, {
            status: 500,
        })
    }
}

export default handler
