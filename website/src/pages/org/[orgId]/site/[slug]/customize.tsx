import { useThrowingFn } from 'beskar/landing'
import classNames from 'classnames'
import { colord } from 'colord'

import {
    GetServerSideProps,
    GetServerSidePropsContext,
    InferGetServerSidePropsType,
} from 'next'
import { createAdminUrl, requireAuth } from 'website/src/lib/ssr'

import { Button } from '@nextui-org/react'
import { SiteData } from 'admin-portal/src/lib/ssr'
import { Block } from 'beskar/dashboard'
import { env } from 'db/env'
import { prisma } from 'db/prisma'
import { SaveIcon } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { BrowserWindow } from 'website/src/components/BrowserWindow'
import { DashboardContainer } from 'website/src/components/DashboardContainer'
import { UploadButton } from 'website/src/components/UploadButton'
import { ColorPicker } from 'website/src/components/form'
import { generateCodeSnippet } from 'website/src/lib/utils'
import { updateSite } from 'website/src/pages/api/functions'

export default function Page({
    sites,
    site,
    host,
    url,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const router = useRouter()
    const { slug, orgId } = router.query as any
    const { fn: update, isLoading } = useThrowingFn({
        async fn() {
            await updateSite({ slug, logoUrl, color })
        },
    })
    const [logoUrl, setLogoUrl] = useState(site.logoUrl)
    const iframeRef = useRef<HTMLIFrameElement>(null)

    const { callbackCode, redirectCode } = generateCodeSnippet({
        host,
        secret: site.secret,
    })
    const iframeScale = 0.8
    const [color, setColor] = useState(site.color || '#000000')
    useEffect(() => {
        updatePageProps({ logoUrl, color }, iframeRef)
    }, [color, logoUrl])
    // params to take: supabase token, site slug (will also be org name, ), logo, and domain
    return (
        <DashboardContainer sites={sites}>
            <div className='text-3xl font-bold'>Customize</div>
            <Block>
                <div className='space-y-3'>
                    <div className=''>Logo on top left</div>
                    <UploadButton
                        onUploadFinished={({ src: logoUrl }) => {
                            setLogoUrl(logoUrl)
                        }}
                    />
                    <div className=''>Primary color</div>
                    <ColorPicker
                        children='color'
                        value={color}
                        defaultValue=''
                        onChange={(color) => {
                            if (color) {
                                color = colord(color).toHslString()
                            } else {
                                color = ''
                            }
                            setColor(color)
                        }}
                    />
                    <div className='flex'>
                        <div className='grow'></div>
                        <Button
                            endContent={<SaveIcon className='w-4' />}
                            isLoading={isLoading}
                            onClick={update}
                            className=''
                        >
                            Save
                        </Button>
                    </div>
                </div>
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
