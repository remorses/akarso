import { TokenData } from '../lib/hooks'
import { colord } from 'colord'
import decodeJwt from 'jwt-decode'

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
    let {
        color,
        secret,
        acsUrl,
        entityId,
        startUrl,
        websiteUrl,
        relayState,
        logoUrl,
        supabaseAccessToken,
        supabaseProjectRef,
    } = site!

    return {
        notFound: false as false,
        secret,
        color: color as string,
        logoUrl,
        supabaseAccessToken,
        supabaseProjectRef,
        acsUrl,
        entityId,
        startUrl,
        websiteUrl,
        relayState,
    }
}

export async function getPayloadForToken({ hash, cookies, secret }) {
    const token = cookies().get(hash)?.value
    if (!token) {
        throw new Error(
            `cannot find token for ${hash} in cookies ${[...cookies().keys()]}`,
        )
    }
    secret = decodeURIComponent(secret)
    // console.log({ secret })
    try {
        const verified = await jwtVerify(
            decodeURIComponent(token),
            new TextEncoder().encode(secret),
        )
        // console.log({ verified })
        const payload: TokenData = verified.payload as any
        return { payload, token, secret, hash, expired: false }
    } catch (error: any) {
        if (error.message.includes('"exp"')) {
            const payload = decodeJwt<TokenData>(token)

            return {
                expired: true,
                token,
                hash,
                payload,
            }
        }
        throw error
    }
}
