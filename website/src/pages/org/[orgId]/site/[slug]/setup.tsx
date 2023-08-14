import { Code } from 'beskar/src/landing/Code'

import {
    GetServerSideProps,
    GetServerSidePropsContext,
    InferGetServerSidePropsType,
} from 'next'
import { getOrgLimitsAndSubs, requireAuth } from 'website/src/lib/ssr'

import { Alert, BlockWithStep } from 'beskar/dashboard'
import { env } from 'db/env'
import { prisma } from 'db/prisma'
import { useRouter } from 'next/router'
import { generateCodeSnippet } from 'website/src/lib/utils'

export default function Page({
    site,
    subs,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const router = useRouter()

    const { slug, orgId } = router.query as any

    const host = `${site.slug}.${env.NEXT_PUBLIC_TENANTS_DOMAIN}`
    const { callbackCode, redirectCode, loginCode } = generateCodeSnippet({
        host,
        secret: site.secret,
    })
    const exampleLink = `https://github.com/remorses/akarso/blob/62bedda2347bfc387a0c4846c6a41ea8e6aba7af/website/src/pages/api/functions.ts#L113`
    return (
        <div className='flex flex-col gap-6'>
            <div className='text-3xl font-bold'>Setup</div>
            <div className=''>
                You can see a full example application written in Next.js{' '}
                <a className='underline' href={exampleLink} target='_blank'>
                    here
                </a>
            </div>
            <div className='grow [&>*]:!max-w-full w-full  flex flex-col'>
                <BlockWithStep step={1}>
                    <div className=''>Install the akarso npm package</div>
                    <Code
                        language='sh'
                        className='text-sm'
                        code={`npm i akarso`}
                    />
                </BlockWithStep>
                <BlockWithStep step={2}>
                    <div className=''>
                        When the user wants to connect SSO, redirect him to the
                        Akarso Admin Portal
                    </div>
                    <Alert
                        // type='warn'
                        // @ts-ignore
                        title={
                            <div className='font-normal'>
                                You should call the akarso functions only on
                                server side
                            </div>
                        }
                    />
                    <Code
                        language='js'
                        className='text-sm'
                        code={redirectCode}
                    />
                </BlockWithStep>
                <BlockWithStep step={3}>
                    <div className=''>
                        In your callback page, connect the SSO provider to your
                        team entity
                    </div>
                    <Code
                        language='js'
                        className='text-sm'
                        code={callbackCode}
                    />
                </BlockWithStep>
                <BlockWithStep isLast step={4}>
                    <div className=''>Users can now sign in with SSO</div>
                    <Code language='js' className='text-sm' code={loginCode} />

                    {/* <Link href={`/org/${orgId}/site/${slug}/customize`}>
                        <Button>Customize Portal</Button>
                    </Link> */}
                </BlockWithStep>
            </div>
        </div>
    )
}

export const getServerSideProps = (async (ctx: GetServerSidePropsContext) => {
    const { supabase, session, redirect } = await requireAuth(ctx)
    const userId = session?.user?.id
    const { orgId, slug } = ctx.query as any
    if (redirect) {
        return { redirect } as const
    }
    const [site, org, sites, { subs, hasFreeTrial }] = await Promise.all([
        prisma.site.findUnique({
            where: {
                slug,
            },
        }),
        prisma.org.findUnique({
            where: {
                orgId,
            },
        }),
        prisma.site.findMany({
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
            },
            orderBy: {
                createdAt: 'desc',
            },
        }),
        getOrgLimitsAndSubs({ orgId }),
    ])
    if (!site || !org) {
        return {
            notFound: true,
        } as const
    }

    return {
        props: {
            sites,
            site,
            subs,
            hasFreeTrial,
        },
    }
}) satisfies GetServerSideProps
