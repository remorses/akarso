"poor man's use server"
import { v4 } from 'uuid'
import { generateSecretValue, requireAuth, wrapMethod } from '@/lib/ssr'
import { SignJWT, generateSecret } from 'jose'
import { getNodejsContext } from 'server-actions-for-next-pages/context'
import { SupabaseManagementAPI } from 'supabase-management-js'
import { prisma } from 'db/prisma'
import { AppError, KnownError } from 'website/src/lib/errors'
import { slugKebabCase } from 'website/src/lib/utils'
import { createSupabaseAdmin } from 'db/supabase'
import { uploadBucketName } from 'db/env'

export { wrapMethod }

export async function onboarding({
    slug,
    supabaseAccessToken,
    supabaseProjectRef,
}) {
    const { req, res } = await getNodejsContext()
    const { userId } = await requireAuth({ req, res })
    slug = slugKebabCase(slug)
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
                        slug,
                        secret: generateSecretValue(),
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

export async function createUploadUrl({ filename }) {
    const { req, res } = getNodejsContext()
    const { userId } = await requireAuth({ req, res })
    if (!userId) {
        throw new AppError('Missing userId')
    }
    let pathname = `/${userId}/${filename}`
    console.log('creating upload url', pathname)
    const supabaseAdmin = createSupabaseAdmin()

    const { data, error } = await supabaseAdmin.storage
        .from(uploadBucketName)
        .createSignedUploadUrl(pathname)
    if (error) {
        throw error
    }
    if (!data) {
        throw new AppError('Missing createSignedUploadUrl data')
    }
    console.log('created upload url', data)
    return data
}

export async function updateSite({ logoUrl, slug, color }) {
    const { req, res } = getNodejsContext()
    const { userId } = await requireAuth({ req, res })
    if (!userId) {
        throw new AppError('Missing userId')
    }
    const site = await prisma.site.findFirst({
        where: {
            slug,
            org: {
                users: {
                    some: {
                        userId,
                    },
                },
            },
        },
    })
    if (!site) {
        throw new AppError(`site not found '${slug}'`)
    }
    console.log('updating site', { logoUrl, slug, color })

    const r = await prisma.site.update({
        where: {
            slug,
        },
        data: {
            color,
            logoUrl,
        },
    })

    return
}
