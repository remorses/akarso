"poor man's use server"
import { v4 } from 'uuid'
import { requireAuth, wrapMethod } from '@/lib/ssr'
import { SignJWT, generateSecret } from 'jose'
import { getNodejsContext } from 'server-actions-for-next-pages/context'
import { SupabaseManagementAPI } from 'supabase-management-js'
import { prisma } from 'db/prisma'
import { AppError, KnownError } from 'website/src/lib/errors'

export { wrapMethod }

export async function onboarding({
    slug,
    supabaseAccessToken,
    supabaseProjectRef,
}) {
    const { req, res } = await getNodejsContext()
    const { userId } = await requireAuth({ req, res })
    if (slug.length < 4) {
        throw new AppError(`slug must be at least 4 characters`)
    }
    if (!userId) {
        throw new AppError(`not authenticated`)
    }
    const client = new SupabaseManagementAPI({
        accessToken: supabaseAccessToken,
    })

    const config = await client.getProjectAuthConfig(supabaseProjectRef)

    const [org] = await Promise.all([
        prisma.org.create({
            data: {
                name: slug,
                // orgId,
                sites: {
                    create: {
                        secret: await generateSecret('HS256'), // TODO is this safe?
                        slug,
                        supabaseAccessToken,
                        supabaseProjectRef,
                    },
                },
                users: {
                    create: {
                        role: 'ADMIN',
                        userId,
                    },
                },
            },
        }),
    ])

    const { orgId } = org
    return {
        orgId,
        slug,
    }
}

export async function getSupabaseProjects({
    supabaseAccessToken: accessToken = '',
}) {
    const { req, res } = await getNodejsContext()

    const supabase = new SupabaseManagementAPI({ accessToken })
    const projects = await supabase.getProjects()
    return projects
}
