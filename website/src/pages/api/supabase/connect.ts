import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { createLoginRedirectUrl } from 'website/src/lib/utils'
import { KnownError } from 'website/src/lib/errors'
import { prisma } from 'db/prisma'
import { notifyError } from 'website/src/lib/sentry'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from 'db/supabase'
import { env } from 'db/env'
import { createSessionUrl } from 'website/src/lib/ssr-edge'

import { __experimental_createOAuth2AuthorizationUrlWithPKCE } from '@lucia-auth/oauth'

export const config = {
    runtime: 'edge',
}

export const redirectUri = new URL(
    `/api/supabase/callback`,
    env.NEXT_PUBLIC_URL,
).toString()

export const supabaseCodeVerifierKey = 'supabase-code-verifier'

const handler = async (req: NextRequest) => {
    try {
        const redirectUrl = req.nextUrl.searchParams.get('redirectUrl') || ''
        const orgId = req.nextUrl.searchParams.get('orgId') || ''
        const slug = req.nextUrl.searchParams.get('slug') || ''
        const [url, state, codeVerifier] =
            await __experimental_createOAuth2AuthorizationUrlWithPKCE(
                'https://api.supabase.com/v1/oauth/authorize',
                {
                    clientId: env.SUPA_CONNECT_CLIENT_ID!,
                    codeChallengeMethod: 'S256',
                    redirectUri,
                    state: JSON.stringify({ redirectUrl, orgId, slug }),
                    scope: ['all'],
                    searchParams: {
                        // access_type: config.accessType ?? 'online',
                    },
                },
            )

        console.log('supabase url', url.toString())
        const res = NextResponse.redirect(url.toString(), {})
        res.cookies.set(supabaseCodeVerifierKey, codeVerifier, {
            path: '/',
            // sameSite: 'lax',
            domain: req.nextUrl.hostname,
        })
        return res
    } catch (error: any) {
        notifyError(error, 'get-session API')
        return NextResponse.json(error.message, {
            status: 500,
        })
    }
}

export default handler
