import { useThrowingFn } from 'beskar/landing'
import { getServerSideProps as commonServerProps } from './setup'

import {
    GetServerSideProps,
    GetServerSidePropsContext,
    InferGetServerSidePropsType,
} from 'next'
import { requireAuth } from 'website/src/lib/ssr'

import { Button, Input } from '@nextui-org/react'
import { Alert, Block } from 'beskar/dashboard'
import { env } from 'db/env'
import { EyeIcon, LockIcon } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { DashboardContainer } from 'website/src/components/DashboardContainer'
import { createSessionUrl } from 'website/src/lib/ssr-edge'
import { rotateSecret, setupSSO } from 'website/src/pages/api/functions'
import { prisma } from 'db/prisma'

export default function Page({
    sites,
    site,
    host,
    org,
    url,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const router = useRouter()
    const { slug, orgId } = router.query as any
    const { fn: setup, isLoading: isLoadingSSO } = useThrowingFn({
        async fn() {
            const url = await setupSSO({ orgId, slug })
            window.location.href = url
        },
    })
    const { fn: rotate, isLoading: isLoadingSecret } = useThrowingFn({
        async fn() {
            const ok = confirm(
                `Are you sure you want to rotate the secret? You will need to update your code`,
            )
            if (!ok) return
            const { secret } = await rotateSecret({ slug, orgId })
            setSecret(secret)
            setIsVisible(true)
        },
    })
    const [secret, setSecret] = useState(site.secret)
    const [isVisible, setIsVisible] = useState(false)

    const toggleVisibility = () => setIsVisible(!isVisible)

    return (
        <DashboardContainer sites={sites}>
            <div className='text-3xl font-bold'>Settings</div>
            <Block className='space-y-6'>
                <Button onClick={setup} isLoading={isLoadingSSO}>
                    {org?.ssoProviderId ? 'Update SSO' : `Setup SSO`}
                </Button>
                <hr className='w-full' />
                <div className=''>Your Akarso Secret</div>
                <div className='space-y-4'>
                    <Input
                        isReadOnly
                        type={isVisible ? 'text' : 'password'}
                        value={secret}
                        endContent={
                            <button
                                className='focus:outline-none'
                                type='button'
                                onClick={toggleVisibility}
                            >
                                {isVisible ? (
                                    <LockIcon className='w-5 text-default-400 pointer-events-none' />
                                ) : (
                                    <EyeIcon className='w-5 text-default-400 pointer-events-none' />
                                )}
                            </button>
                        }
                    />
                </div>
                <hr className='w-full' />
                <div className=''>Update Akarso Secret</div>
                <Alert
                    type='warn'
                    title='If you rotate the secret you will also need to update it in your code'
                />
                <Button onClick={rotate} isLoading={isLoadingSecret}>
                    Rotate Secret
                </Button>
            </Block>
        </DashboardContainer>
    )
}

export const getServerSideProps = (async (ctx: GetServerSidePropsContext) => {
    const { supabase, session } = await requireAuth(ctx)
    const userId = session?.user?.id
    const { orgId, slug } = ctx.query as any

    const [{ props, notFound, redirect: red }, org] = await Promise.all([
        commonServerProps(ctx),
        prisma.org.findUnique({
            where: {
                orgId,
            },
        }),
    ])
    if (red) {
        return { redirect: red }
    }
    if (notFound) {
        return { notFound }
    }
    const { site, sites } = props!

    let host = `${site.slug}.${env.NEXT_PUBLIC_TENANTS_DOMAIN}`
    const { url } = await createSessionUrl({
        secret: site.secret,
        callbackUrl: new URL(`/`, env.NEXT_PUBLIC_URL).toString(),
        identifier: '',
    })

    // console.log('host', host, url)
    return {
        props: {
            sites,
            host,
            org,
            site,
            url,
        },
    }
}) satisfies GetServerSideProps
