import { NextApiHandler } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { createLoginRedirectUrl } from 'website/src/lib/utils'
import { KnownError } from 'website/src/lib/errors'
import { prisma } from 'db/prisma'
import { notifyError } from 'website/src/lib/sentry'

const handler = async (req, res) => {
    const { code } = req.query
    console.log('query', req.query)
    let { redirectTo }: Parameters<typeof createLoginRedirectUrl>[0] = req.query
    redirectTo ||= '/dashboard'

    const supabase = createPagesServerClient({ req, res })

    if (!code) {
        console.warn('Missing code for auth callback!')
        console.log(JSON.stringify(req.query, null, 2))

        res.redirect(redirectTo)
        return
    }
    const { data, error } = await supabase.auth.exchangeCodeForSession(
        String(code),
    )

    if (error) {
        throw new KnownError(`Login didn't work`, { cause: error })
    }

    const userId = data.user?.id

    // console.log('user', JSON.stringify(data.user, null, 2))

    if (!data.user?.created_at) {
        return res.redirect(redirectTo)
    }
    const createdAt = new Date(data.user?.created_at)
    const now = new Date()
    const diff = now.getTime() - createdAt.getTime()
    const minutes = Math.floor(diff / 1000 / 60)
    if (minutes > 5) {
        console.log(
            `Not a signup because user is ${minutes} old minutes, redirecting`,
        )
        return res.redirect(redirectTo)
    }
    const provider = data.user?.app_metadata?.provider
    const isSSO = provider?.startsWith('sso:') // TODO this could be brittle, supabase could remove sso: prefix, data.user?.identities maybe is better
    if (isSSO && provider) {
        console.log(
            `SSO user ${data.user?.email} is signing up, adding to org with sso provider id ${provider}`,
        )
        const org = await prisma.org.findUnique({
            where: {
                ssoProviderId: provider.replace('sso:', ''),
            },
        })
        if (org) {
            const orgId = org.orgId
            await prisma.orgsUsers.upsert({
                where: {
                    userId_orgId: {
                        orgId,
                        userId: data.user?.id,
                    },
                },
                create: {
                    orgId,
                    userId,
                    role: 'MEMBER',
                },
                update: {},
            })
        }
    }



    return res.redirect(redirectTo)
}

export default handler
