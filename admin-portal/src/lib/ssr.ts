import { env } from 'db/env'
import { createSupabaseAdmin } from 'db/supabase'

if (typeof window === 'undefined') {
    throw new Error('this file is for ssr only')
}

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
    const supabase = createSupabaseAdmin({ cacheTags: [host] })
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

export async function getPortalSession({ hash, host, secret }) {
    secret = decodeURIComponent(secret)
    // console.log({ secret })
    const supabase = createSupabaseAdmin({ cacheTags: [host] })
    const { data, error } = await supabase
        .from('PortalSession')
        .select()
        .eq('hash', hash)
        .limit(1)
    if (error) {
        throw new Error(`failed to get payload for hash: ${error.message}`)
    }
    const [session] = data || []
    if (!session) {
        return { notFound: true as const }
    }
    // console.log({ session })
    const exp = new Date(session.expiresAt + 'Z')
    const now = new Date()
    if (exp.getTime() < now.getTime()) {
        console.log(
            `expired from ${
                (now.getTime() - exp.getTime()) / (1000 * 60)
            } minutes`,
        )
        return {
            expired: true as true,
        }
    }
    return {
        payload: session,
        hash: hash,

        expired: false as false,
        notFound: false as false,
    }
}

export async function refreshSupabaseToken({ supabaseRefreshToken }) {
    console.log(`refreshing supabase token`)
    const clientId = env.SUPA_CONNECT_CLIENT_ID!
    const clientSecret = env.SUPA_CONNECT_CLIENT_SECRET!
    const tokensRes = await fetch('https://api.supabase.com/v1/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: supabaseRefreshToken,
        }),
    })
    if (!tokensRes.ok) {
        throw new Error(
            `Failed to fetch tokens from Supabase: ${await tokensRes.text()}`,
        )
    }
    const tokens = await tokensRes.json()
    // console.log('tokens', tokens)
    {
        const {
            access_token: supabaseAccessToken,
            refresh_token: supabaseRefreshToken,
        } = tokens
        return {
            supabaseAccessToken,
            supabaseRefreshToken,
        }
    }
}
