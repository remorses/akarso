import { GetServerSidePropsContext, GetServerSideProps } from 'next'
import { prisma } from 'db/prisma'
import { requireAuth } from 'website/src/lib/ssr'

export default function Page() {
    return null
}

export const getServerSideProps = (async (ctx: GetServerSidePropsContext) => {
    const { supabase, session, redirect } = await requireAuth(ctx)
    const userId = session?.user?.id
    if (redirect) {
        return { redirect }
    }
    const [site] = await Promise.all([
        prisma.site.findFirst({
            where: {
                org: {
                    users: {
                        some: {
                            userId,
                        },
                    },
                },
            },
            select: {
                orgId: true,
                siteId: true,
                slug: true,
                org: true,
            },
        }),
    ])
    if (!site) {
        return {
            redirect: {
                destination: `/onboarding`,
                permanent: false,
            },
        }
    }

    return {
        redirect: {
            destination: `/org/${site.orgId}/site/${site.slug}`,
            permanent: false,
        },
    }
}) satisfies GetServerSideProps
