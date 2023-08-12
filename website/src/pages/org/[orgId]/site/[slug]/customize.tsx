import { Spinner, useThrowingFn } from 'beskar/landing'
import { Code } from 'beskar/src/landing/Code'
import classNames from 'classnames'

import {
    GetServerSideProps,
    GetServerSidePropsContext,
    InferGetServerSidePropsType,
} from 'next'
import { createAdminUrl, requireAuth } from 'website/src/lib/ssr'

import { RefreshCwIcon } from 'lucide-react'
import { useRouter } from 'next/router'
import { useRef, useState } from 'react'
import { env } from 'website/../db/env'
import { prisma } from 'website/../db/prisma'
import { DashboardContainer } from 'website/src/components/DashboardContainer'
import { generateCodeSnippet, isDev } from 'website/src/lib/utils'
import { onboarding, updateSite } from 'website/src/pages/api/functions'
import { Block, BlockWithStep } from 'website/../beskar/dashboard'
import { BrowserWindow } from 'website/src/components/BrowserWindow'
import { updateOrCreateSSOConnection } from 'website/../akarso/dist'
import { ProviderSetupParams, SiteData } from 'website/src/lib/hooks'
import { UploadButton } from 'website/src/components/UploadButton'

export default function Page({
    sites,
    site,
    host,
    url,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const router = useRouter()
    const { fn: update, isLoading } = useThrowingFn({
        async fn(data) {
            console.log(data)
            await updateSite(data)
        },
    })
    const iframeRef = useRef<HTMLIFrameElement>(null)

    const [loaded, setLoaded] = useState(false)
    const { callbackCode, redirectCode } = generateCodeSnippet({
        host,
        secret: site.secret,
    })
    const iframeScale = 0.8

    // params to take: supabase token, site slug (will also be org name, ), logo, and domain
    return (
        <DashboardContainer sites={sites}>
            <div className='text-3xl font-bold'>Customize</div>
            <Block>
                <div className=''>Logo on top left</div>
                <UploadButton
                    onUploadFinished={({ src: logoUrl }) => {
                        updatePageProps({ logoUrl }, iframeRef)
                        update({ logoUrl })
                    }}
                />
            </Block>
            <div className='flex min-h-[600px] flex-col'>
                <BrowserWindow
                    url={url}
                    onRefresh={() => {
                        const iframe = iframeRef.current
                        if (iframe) {
                            iframe.src += ''
                        }
                    }}
                    className={classNames(
                        '!text-sm shrink-0 shadow rounded-xl justify-stretch',
                        'items-stretch h-full flex-col flex-1 border',
                        'bg-white lg:flex dark:bg-gray-800',
                    )}
                >
                    <iframe
                        ref={iframeRef}
                        style={{
                            transform: `scale(${iframeScale})`,
                            transformOrigin: 'top left',
                            width: `${Number(100 / iframeScale).toFixed(1)}%`,
                            height: `${Number(100 / iframeScale).toFixed(1)}%`,
                        }}
                        className={classNames(
                            ' inset-0 bg-transparent',
                            'absolute',
                        )}
                        frameBorder={0}
                        allowTransparency
                        name='previewProps' // tell iframe preview props is enabled
                        height='120%'
                        width='100%'
                        title='website preview'
                        // onLoad={() => setLoaded(true)}
                        src={url}
                    ></iframe>
                    {/* {!loaded && (
                        <div className='flex justify-center items-center inset-0 absolute'>
                            <Spinner className='text-gray-600 text-5xl'></Spinner>
                        </div>
                    )} */}
                </BrowserWindow>
            </div>
        </DashboardContainer>
    )
}

function updatePageProps(newPageProps: Partial<SiteData>, iframeRef) {
    if (!iframeRef?.current || !newPageProps) {
        console.log('updatePageProps: no iframeElement or newPageProps')
        return
    }
    iframeRef?.current?.contentWindow.postMessage(
        { newPageProps },
        { targetOrigin: '*' },
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
    let host = `${site.slug}.${env.NEXT_PUBLIC_TENANTS_DOMAIN}`
    const { url } = await createAdminUrl({ host, secret: site.secret })

    return {
        props: {
            sites,
            host,
            site,
            url,
        },
    }
}) satisfies GetServerSideProps
