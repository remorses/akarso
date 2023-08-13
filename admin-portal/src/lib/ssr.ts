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
export type SiteData = Awaited<ReturnType<typeof getSiteDataFromHost>> & {
    notFound: false
}

export async function getSiteDataFromHost({ host }) {
    host = decodeURIComponent(host)
    const supabase = createSupabaseAdmin()
    const slug = host.replace('.' + env.NEXT_PUBLIC_TENANTS_DOMAIN, '')
    const isSlug = host.includes(env.NEXT_PUBLIC_TENANTS_DOMAIN)
    // console.log({ slug, isSlug, host })
    const { data, error } = isSlug
        ? await supabase.from('Site').select().eq('slug', slug).limit(1)
        : await supabase.from('Site').select().eq('customDomain', host).limit(1)
    const [site] = data || []
    if (error) {
        throw new Error(
            `failed to get tenant data from host: ${host} and ${slug}: ${error.message}`,
        )
    }
    if (!site) {
        return { notFound: true as const }
    }

    return {
        notFound: false as const,
        ...site!,
    }
}

export async function getPayloadForToken({ hash, secret }) {
    secret = decodeURIComponent(secret)
    // console.log({ secret })
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
        .from('PortalSession')
        .select()
        .eq('hash', hash)
        .limit(1)
    if (error) {
        throw new Error(`failed to get payload for hash: ${error.message}`)
    }
    const [session] = data || []

    if (!session || new Date(session.expiresAt) < new Date()) {
        return {
            expired: true as true,
        }
    }
    return { payload: session, token: hash, expired: false as false }
}
