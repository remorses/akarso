"poor man's use server"
import {
    createAkarsoAdminPortalSession,
    getAkarsoCallbackResult,
} from 'akarso/src'
import { v4 } from 'uuid'
import {
    generateSecretValue,
    requireAuth,
    revalidateSiteSSGCache,
    wrapMethod,
} from '@/lib/ssr'
import { SignJWT, generateSecret } from 'jose'
import { getNodejsContext } from 'server-actions-for-next-pages/context'
import { SupabaseManagementAPI } from 'supabase-management-js'
import { prisma } from 'db/prisma'
import { AppError, KnownError } from 'website/src/lib/errors'
import { slugKebabCase } from 'website/src/lib/utils'
import { createSupabaseAdmin } from 'db/supabase'
import { env, uploadBucketName } from 'db/env'
import { NextApiResponse } from 'next'

export { wrapMethod }

export async function onboarding({
    slug,
    supabaseAccessToken,
    supabaseRefreshToken,
    websiteUrl,
    supabaseProjectRef,
}) {
    if (!websiteUrl) {
        throw new AppError(`websiteUrl is required`)
    }
    if (!supabaseRefreshToken) {
        throw new AppError(`supabaseRefreshToken is required`)
    }
    if (!supabaseAccessToken) {
        throw new AppError(`supabaseAccessToken is required`)
    }
    if (!websiteUrl.includes('https://') && !websiteUrl.includes('http://')) {
        websiteUrl = `https://${websiteUrl}`
    }
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

    const acsUrl = `https://${supabaseProjectRef}.supabase.co/auth/v1/sso/saml/acs`
    const entityId = `https://${supabaseProjectRef}.supabase.co/auth/v1/sso/saml/metadata`
    const relayState = `https://${supabaseProjectRef}.supabase.co`

    const ssoMappings = {}
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
                        supabaseRefreshToken,
                        supabaseProjectRef,
                        acsUrl,
                        entityId,
                        ssoMappings,
                        websiteUrl,
                        relayState,
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
    const [projects, orgs] = await Promise.all([
        supabase.getProjects(),
        supabase.getOrganizations(),
    ])
    return (
        projects?.map((x) => {
            const org = orgs?.find((org) => org?.id === x?.organization_id)
                ?.name
            return {
                ...x,
                org,
            }
        }) || []
    )
}

export async function setupSSO({ orgId, slug }) {
    const { req, res } = await getNodejsContext()
    const { userId } = await requireAuth({ req, res })
    if (!userId) {
        throw new AppError('Missing userId')
    }
    const org = await prisma.org.findFirst({
        where: {
            orgId,
            users: {
                some: {
                    userId,
                    role: 'ADMIN',
                },
            },
        },
    })
    if (!org) {
        throw new AppError(`org not found '${orgId}'`)
    }

    const { url } = await createAkarsoAdminPortalSession({
        callbackUrl: `${env.NEXT_PUBLIC_URL}/api/akarso-callback`,
        identifier: orgId,
        secret: env.AKARSO_SECRET!,
        metadata: { userId, slug },
    })
    return url
}

export async function rotateSecret({ orgId, slug }) {
    const { req, res } = await getNodejsContext()
    const { userId } = await requireAuth({ req, res })
    if (!userId) {
        throw new AppError('Missing userId')
    }
    const site = await prisma.site.findFirst({
        where: {
            slug,
            org: {
                orgId,
                users: {
                    some: {
                        userId,
                        role: 'ADMIN',
                    },
                },
            },
        },
    })
    if (!site) {
        throw new AppError(`site not found '${orgId}'`)
    }
    const secret = generateSecretValue()
    await prisma.site.update({
        where: {
            slug,
        },
        data: {
            secret,
        },
    })
    return { secret }
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
    if (!color) {
        color = undefined
    }
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

    const [r] = await Promise.all([
        prisma.site.update({
            where: {
                slug,
            },
            data: {
                color,
                logoUrl,
            },
        }),
        revalidateSiteSSGCache({ slug }),
    ])

    return
}

export async function deleteSite({ slug, orgId }) {
    const { req, res } = getNodejsContext()
    const { userId } = await requireAuth({ req, res })
    if (!userId) {
        throw new AppError('Missing userId')
    }
    const r = await prisma.site.deleteMany({
        where: {
            slug,
            org: {
                orgId,
                users: {
                    some: {
                        userId,
                        role: 'ADMIN',
                    },
                },
            },
        },
    })
    if (!r.count) {
        throw new AppError(`site not found '${slug}'`)
    }
}
