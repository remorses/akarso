import path from 'path'

export const env = {
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_TENANTS_DOMAIN: process.env.NEXT_PUBLIC_TENANTS_DOMAIN,
    REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
    DEMO_ORG_ID: process.env.DEMO_ORG_ID,
    AKARSO_SECRET: process.env.AKARSO_SECRET,
    SUPA_CONNECT_CLIENT_SECRET: process.env.SUPA_CONNECT_CLIENT_SECRET,
    SUPA_CONNECT_CLIENT_ID: process.env.SUPA_CONNECT_CLIENT_ID,
    DOCS_URL: process.env.DOCS_URL,
}

if (typeof window === 'undefined') {
    for (const k in env) {
        if (env[k] == null) {
            // console.error(env)
            throw new Error(`Missing required ssr env var '${k}'`)
        }
    }
}

for (const k in env) {
    if (k.startsWith('NEXT_PUBLIC') && env[k] == null) {
        throw new Error(`Missing required client env var '${k}'`)
    }
}

function stagingValue(a, b) {
    return env.NEXT_PUBLIC_ENV === 'production' ? a : b
}

export const MAX_CONNECTIONS = {
    free: 3, // three is free!
    startup: 20,
    business: 100,
}

export const prices = {
    monthlyStartup: {
        addon: false,
        id: stagingValue(
            'price_1Nf3YBHLbEXYizoqJ4jjiHm2',
            'price_1Ney9EHLbEXYizoqakK1TjqH',
        ),
        usd: 99,
    },
    yearlyStartup: {
        addon: false,
        id: stagingValue(
            'price_1Nf3YBHLbEXYizoq9H2ul1LA',
            'price_1Ney9EHLbEXYizoqAjBMZGjp',
        ),
        usd: 80,
    },
    monthlyBusiness: {
        addon: false,
        id: stagingValue(
            'price_1Nf3ZUHLbEXYizoq1Z6fnAAx',
            'price_1Nf0gSHLbEXYizoq5PyjJqBL',
        ),
        usd: 299,
    },
    yearlyBusiness: {
        addon: false,
        id: stagingValue(
            'price_1Nf3ZUHLbEXYizoqVxgS8aIZ',
            'price_1Nf0gSHLbEXYizoqLRlHBcDI',
        ),
        usd: 239,
    },
} as const

export type AddonType = Exclude<
    (typeof prices)[keyof typeof prices]['addon'],
    false
>

export const uploadBucketName = 'user-uploads'

export const UPLOADS_BASE_URL = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${uploadBucketName}/`

export const DEMO_SITE_SECRET = 'DEMO_SITE_SECRET'

export type Plan = 'startup' | 'business'
