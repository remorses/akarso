import path from 'path'

export const env = {
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    // NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    //     process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    // STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    // STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_TENANTS_DOMAIN: process.env.NEXT_PUBLIC_TENANTS_DOMAIN,
    REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
    DEMO_ORG_ID: process.env.DEMO_ORG_ID,
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
export const uploadBucketName = 'user-uploads'

export const UPLOADS_BASE_URL = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${uploadBucketName}/`

export const DEMO_SITE_SECRET = 'DEMO_SITE_SECRET'
