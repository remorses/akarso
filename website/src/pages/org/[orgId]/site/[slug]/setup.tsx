import { Spinner, useThrowingFn } from 'beskar/landing'
import { Code } from 'beskar/src/landing/Code'
import classNames from 'classnames'

import {
    GetServerSideProps,
    GetServerSidePropsContext,
    InferGetServerSidePropsType,
} from 'next'
import { requireAuth } from 'website/src/lib/ssr'

import { RefreshCwIcon } from 'lucide-react'
import { useRouter } from 'next/router'
import { useRef, useState } from 'react'
import { env } from 'db/env'
import { prisma } from 'db/prisma'
import { DashboardContainer } from 'website/src/components/DashboardContainer'
import { generateCodeSnippet, isDev } from 'website/src/lib/utils'
import { onboarding } from 'website/src/pages/api/functions'
import { Block, BlockWithStep } from 'beskar/dashboard'
import { BrowserWindow } from 'website/src/components/BrowserWindow'
import { Button } from '@nextui-org/react'
import Link from 'next/link'

export default function Page({
    sites,
    site,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const router = useRouter()
    const { fn: onSubmit, isLoading } = useThrowingFn({
        async fn(data) {
            console.log(data)
            const { orgId, slug } = await onboarding(data)
            router.push(`/org/${orgId}/site/${slug}`)
        },
    })
    const { slug, orgId } = router.query as any
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const host = `${site.slug}.${env.NEXT_PUBLIC_TENANTS_DOMAIN}`
    const [loaded, setLoaded] = useState(false)
    const { callbackCode, redirectCode, loginCode } = generateCodeSnippet({
        host,
        secret: site.secret,
    })
    // params to take: supabase token, site slug (will also be org name, ), logo, and domain
    return (
        <DashboardContainer sites={sites}>
            <div className='text-3xl font-bold'>Setup</div>
            <div className='grow [&>*]:!max-w-full -mt-12 w-full  flex flex-col'>
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
        </DashboardContainer>
    )
}

export const getServerSideProps = (async (ctx: GetServerSidePropsContext) => {
    const { supabase, session, redirect } = await requireAuth(ctx)
    const userId = session?.user?.id
    const { orgId, slug } = ctx.query as any
    if (redirect) {
        return { redirect }
    }
    const [site, org, sites] = await Promise.all([
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
        }),
    ])
    if (!site || !org) {
        return {
            notFound: true,
        }
    }

    return {
        props: {
            sites,
            site,
        },
    }
}) satisfies GetServerSideProps
