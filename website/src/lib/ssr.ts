import { ProviderSetupParams } from '@/lib/hooks'
import crypto from 'crypto'
import { createSupabaseAdmin } from 'db/supabase'
import { createClient } from '@supabase/supabase-js'
import { SignJWT, jwtVerify } from 'jose'
import { env } from 'db/env'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { notifyError } from '@/lib/sentry'
import { isDev } from 'website/src/lib/utils'

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

export async function requireAuth({ req, res }) {
    if (!req || !res) {
        throw new Error(`ctx.req and ctx.res are required`)
    }
    const supabase = createPagesServerClient({ req, res })

    // Check if we have a session
    const {
        data: { session },
        error,
    } = await supabase.auth.getSession()
    if (error) {
        notifyError(error, 'requireAuth')
    }
    const userId = session?.user?.id
    const email = session?.user?.email
    if (!session || !userId || !email) {
        console.log('no session')
        return {
            userId: null,
            redirect: {
                destination: '/login',
                permanent: false,
            },
        }
    }

    return { session, userId, email, supabase }
}

export const generateSecretValue = () => {
    const secretLength = 16 // Length of the secret value in bytes

    // Generate random bytes
    const buffer = crypto.randomBytes(secretLength)

    // Convert the buffer to a hexadecimal string
    const secretValue = buffer.toString('hex')

    return secretValue
}

export async function createSessionUrl({
    secret,
    callbackUrl,
    identifier,

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
            slug: site.slug,
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
