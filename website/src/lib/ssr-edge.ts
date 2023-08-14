import { DashboardProps } from '@/lib/hooks'
import crypto from 'crypto'
import { createSupabaseAdmin } from 'db/supabase'
import { createClient } from '@supabase/supabase-js'
import { SignJWT, jwtVerify } from 'jose'
import { env } from 'db/env'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { notifyError } from '@/lib/sentry'
import { isDev } from 'website/src/lib/utils'
import { prisma } from 'db/prisma'

export async function createSessionUrl({
    secret,
    callbackUrl,
    identifier,
    // orgId = '',
    metadata = {},
}) {
    if (!secret) {
        throw new Error('Missing secret')
    }
    const supabase = createSupabaseAdmin()
    const [{ data: site, error: siteErr }] = await Promise.all([
        supabase.from('Site').select().eq('secret', secret).single(),
    ])
    if (siteErr) {
        throw siteErr
    }
    if (!site) {
        throw new Error('Site not found')
    }
    let orgId = site?.orgId!
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)
    const hash = Math.random().toString(36).substring(2, 15)
    const { data, error } = await supabase
        .from('PortalSession')
        .insert({
            secret,
            callbackUrl,
            expiresAt: expiresAt.toISOString(),
            identifier,
            slug: site.slug,
            orgId,
            hash,
            metadata,
        })
        .select()
    if (error) {
        throw error
    }
    const host =
        site.customDomain || `${site.slug}.${env.NEXT_PUBLIC_TENANTS_DOMAIN}`
    const url = `${
        isDev ? 'http://' : 'https://'
    }${host}/session/${encodeURIComponent(hash)}`
    return {
        ...data,
        url,
        host,
    }
}
