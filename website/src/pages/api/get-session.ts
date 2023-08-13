import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { createLoginRedirectUrl } from 'website/src/lib/utils'
import { KnownError } from 'website/src/lib/errors'
import { prisma } from 'db/prisma'
import { notifyError } from 'website/src/lib/sentry'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from 'db/supabase'
import { env } from 'db/env'

export const config = {
    runtime: 'edge',
}

const handler = async (req: NextRequest) => {
    if (req.method !== 'POST') {
        return NextResponse.json('Method Not Allowed', {
            status: 405,
        })
    }
    const {
        secret,
        callbackUrl,
        identifier,
        slug,
        metadata = {},
    } = await req.json()
    if (!secret) {
        return NextResponse.json('Missing secret', {
            status: 400,
        })
    }
    const supabase = createSupabaseAdmin()
    const [{ data: site, error: siteErr }] = await Promise.all([
        supabase.from('Site').select().eq('secret', secret).single(),
    ])
    if (siteErr) {
        throw siteErr
    }
    if (!site) {
        return NextResponse.json('Not found', {
            status: 404,
        })
    }
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)
    const hash = Math.random().toString(36).substring(7)
    const { data, error } = await supabase
        .from('PortalSession')
        .insert({
            secret,
            callbackUrl,
            expiresAt: expiresAt.toISOString(),
            identifier,
            slug,
            hash,
            metadata,
        })
        .select()
    if (error) {
        throw error
    }
    const host =
        site.customDomain || `${site.slug}.${env.NEXT_PUBLIC_SUPABASE_URL}`
    return NextResponse.json({
        // TODO wait for customDomain to be valid first
        ...data,
        host,
    })
}

export default handler
