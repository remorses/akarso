import { ProviderSetupParams } from '../lib/hooks'
import { createSupabaseAdmin } from 'db/supabase'
import { createClient } from '@supabase/supabase-js'
import { jwtVerify } from 'jose'
import { env } from 'db/env'
import { cookies } from 'next/headers'

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
export type SiteData = Awaited<ReturnType<typeof getSiteDataFromHost>>


export async function getSiteDataFromHost({ host }) {
    host = decodeURIComponent(host)
    const supabase = createSupabaseAdmin()
    const slug = host.replace('.' + env.NEXT_PUBLIC_TENANTS_DOMAIN, '')
    const isSlug = host.includes(env.NEXT_PUBLIC_TENANTS_DOMAIN)
    // console.log({ slug, isSlug, host })
    const { data: site, error } = isSlug
        ? await supabase.from('Site').select().eq('slug', slug).single()
        : await supabase.from('Site').select().eq('customDomain', host).single()
    if (error) {
        throw new Error(
            `failed to get tenant data from host: ${host}: ${error.message}`,
        )
    }
    if (!site) {
        return { notFound: true as true }
    }
    const { color, secret, logoUrl, supabaseAccessToken, supabaseProjectRef } =
        site!
    return {
        notFound: false as false,
        secret,
        color,
        logoUrl,
        supabaseAccessToken,
        supabaseProjectRef,
    }
}

export async function getPayloadForToken({ token: hash, cookies, secret }) {
    const token = cookies().get(hash)?.value
    if (!token) {
        console.log('no token for hash', hash, cookies().getAll())
        return {}
    }
    secret = decodeURIComponent(secret)
    // console.log({ secret })
    const verified = await jwtVerify(
        decodeURIComponent(token),
        new TextEncoder().encode(secret),
    )
    const payload: ProviderSetupParams = verified.payload as any
    return { payload, secret }
}
