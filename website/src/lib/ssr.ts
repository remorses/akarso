import { ProviderSetupParams } from '@/lib/hooks'
import { createSupabaseAdmin } from 'db/supabase'
import { createClient } from '@supabase/supabase-js'
import { jwtVerify } from 'jose'
import { env } from 'db/env'

export function wrapMethod(fn) {
    return async (...args) => {
        try {
            const res = await fn(...args)
            return res
        } catch (error) {
            console.error(error)
            throw error
        }
    }
}

export async function getTenantDataFromHost({ host }) {
    const supabase = createSupabaseAdmin()
    const slug = host.replace(env.NEXT_PUBLIC_TENANTS_DOMAIN, '')
    const isSlug = host !== slug
    const { data: site, error } = isSlug
        ? await supabase.from('Site').select().eq('slug', slug).single()
        : await supabase.from('Site').select().eq('customDomain', host).single()
    if (error) {
        throw error
    }
    if (!site) {
        return { notFound: true as true }
    }
    const { color, secret, supabaseAccessToken, supabaseProjectRef } = site!
    return {
        notFound: false as false,
        secret,
        color,
        supabaseAccessToken,
        supabaseProjectRef,
    }
}

export async function getPayloadForToken({ token, secret }) {
    const verified = await jwtVerify(
        decodeURIComponent(token),
        new TextEncoder().encode(secret),
    )
    const payload: ProviderSetupParams = verified.payload as any
    return { payload, secret }
}
