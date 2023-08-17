import { env } from 'db/env'
import { createSupabaseAdmin } from 'db/supabase'
import { isDev } from 'website/src/lib/utils'
import { customAlphabet } from 'nanoid'

export function randomHash(len = 12) {
    const nanoid = customAlphabet('1234567890abcdefghilmnopqrstvuxyz', len)
    return nanoid()
}

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
    const hash = await randomHash()
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
