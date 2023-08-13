import { ProviderSetupParams } from '@/lib/hooks'
import crypto from 'crypto'
import { createSupabaseAdmin } from 'db/supabase'
import { createClient } from '@supabase/supabase-js'
import { SignJWT, jwtVerify } from 'jose'
import { env } from 'db/env'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { notifyError } from '@/lib/sentry'
import { isDev } from 'website/src/lib/utils'
import { prisma } from 'db/prisma'

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

export async function revalidateSiteSSGCache({ slug = '', host = '' }) {
    console.info('Revalidating site', slug)
    const isPreview = process.env.NODE_ENV === ('preview' as any)
    try {
        let hosts = [host].filter(Boolean)
        if (!host) {
            const [site] = await Promise.all([
                prisma.site.findFirst({ where: { slug } }),
            ])
            host = site?.slug + '.' + env.NEXT_PUBLIC_TENANTS_DOMAIN

            if (site?.customDomain) hosts.push(...site?.customDomain)
        }
        const url = new URL(
            '/api/revalidate',
            `${isDev ? 'http://' : 'https://'}${host}`,
        ).toString()
        console.log(`asking revalidation to ${url}`)
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                secret: env.REVALIDATE_SECRET,
                tags: hosts,
            }),
        })
        if (!res.ok) {
            throw new Error(
                `Failed to revalidate site ${slug}: ${res.status} ${(
                    await res.text()
                ).slice(0, 100)}`,
            )
        }
    } catch (e) {
        notifyError(e, 'revalidateSiteSSGCache')
    }
}
