import { Spinner, useThrowingFn } from 'beskar/landing'
import { Code } from 'beskar/src/landing/Code'
import classNames from 'classnames'
import useSwr from 'swr'
import { BlockWithStep } from 'beskar/dashboard'

import {
    GetServerSidePropsContext,
    GetServerSidePropsResult,
    InferGetServerSidePropsType,
    GetServerSideProps,
} from 'next'
import { requireAuth } from 'website/src/lib/ssr'

import { Button, Input, Radio, cn } from '@nextui-org/react'
import { useRouter } from 'next/router'
import { useRef, useState } from 'react'
import { OnboardingContainer } from 'website/src/components/OnboardingContainer'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { SimpleSelect } from 'website/src/components/SimpleSelect'
import {
    getSupabaseProjects,
    onboarding,
} from 'website/src/pages/api/functions'
import { toast } from 'react-hot-toast'
import { generateCodeSnippet, slugKebabCase } from 'website/src/lib/utils'
import { prisma } from 'website/../db/prisma'
import { DashboardContainer } from 'website/src/components/DashboardContainer'
import { env } from 'website/../db/env'
import { RefreshCwIcon } from 'lucide-react'
const isDev = env.NEXT_PUBLIC_ENV === 'development'
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
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const host = `${site.slug}.${env.NEXT_PUBLIC_TENANTS_DOMAIN}`
    const [loaded, setLoaded] = useState(false)
    // params to take: supabase token, site slug (will also be org name, ), logo, and domain
    return (
        <DashboardContainer sites={sites}>
            <div className='flex self-stretch w-full gap-12'>
                <div className='grow max-w-[50%]'>
                    <Code
                        language='js'
                        className='text-sm'
                        code={generateCodeSnippet({
                            host,
                            secret: site.secret,
                        })}
                    />
                </div>
                <div className='flex min-h-[500px] flex-col'>
                    <BrowserWindow
                        host={host}
                        onRefresh={() => {
                            const iframe = iframeRef.current
                            if (iframe) {
                                iframe.src += ''
                            }
                        }}
                        className={classNames(
                            '!text-sm shrink-0 shadow rounded-xl justify-stretch',
                            'items-stretch hidden h-full flex-col flex-1 border',
                            'bg-white lg:flex dark:bg-gray-800',
                        )}
                    >
                        <iframe
                            ref={iframeRef}
                            className={classNames(
                                'min-w-full min-h-full inset-0 bg-transparent',
                                'absolute',
                            )}
                            frameBorder={0}
                            allowTransparency
                            name='previewProps' // tell iframe preview props is enabled
                            height='100%'
                            width='100%'
                            title='website preview'
                            onLoad={() => setLoaded(true)}
                            src={`${
                                isDev ? 'http' : 'https'
                            }://${host}?previewProps=true`}
                        ></iframe>
                        {!loaded && (
                            <div className='flex justify-center items-center inset-0 absolute'>
                                <Spinner className='text-gray-600 text-5xl'></Spinner>
                            </div>
                        )}
                    </BrowserWindow>
                </div>
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

export function BrowserWindow({
    children,
    className = '',
    onRefresh,
    host = 'example.com',
}) {
    return (
        <figure
            className={classNames(
                'shadow-xl rounded-b-md relative max-w-full h-full',
                'z-[1] shadow-[0_2.75rem_3.5rem_-2rem_rgb(45_55_75_/_20%),_0_0_5rem_-2rem_rgb(45_55_75_/_15%)]',
                'dark:shadow-[0_2.75rem_3.5rem_-2rem_rgb(0_0_0_/_20%),_0_0_5rem_-2rem_rgb(0_0_0_/_15%)]',
                className,
            )}
        >
            <div
                className={classNames(
                    'rounded-t-md relative py-2 pl-24 items-center',
                    'flex bg-gray-800 dark:bg-gray-700',
                )}
            >
                <div
                    className={classNames(
                        'top-2/4 space-x-2 left-4 flex absolute -translate-y-1',
                        '[&>span]:w-3 [&>span]:h-3',
                    )}
                >
                    <span className=' bg-gray-600 rounded-full dark:bg-gray-600' />
                    <span className=' bg-gray-600 rounded-full dark:bg-gray-600' />
                    <span className=' bg-gray-600 rounded-full dark:bg-gray-600' />
                </div>
                <a
                    href={`${isDev ? 'http://' : 'https://'}${host}`}
                    target='_blank'
                    className={classNames(
                        'truncate text-gray-200 rounded px-40 mx-auto',
                        'justify-center items-center h-full flex bg-gray-700',
                        'appereance-none dark:bg-gray-600',
                    )}
                >
                    {host}
                </a>
                <div className='pr-20'></div>
                <button
                    aria-label='refresh'
                    onClick={onRefresh}
                    className={classNames(
                        'text-white rounded ring-gray-500 p-px opacity-70',
                        'appereance-none hover:ring-1 active:opacity-30',
                    )}
                    children={<RefreshCwIcon className='h-4' />}
                />
                <div className='pr-4'></div>
            </div>
            <div
                className={classNames(
                    'rounded-b-md relative overflow-hidden flex-col',
                    'flex-1',
                )}
            >
                {children}
            </div>
        </figure>
    )
}
