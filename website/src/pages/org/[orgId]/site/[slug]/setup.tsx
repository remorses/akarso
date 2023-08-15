import { Code as BigCode } from 'beskar/src/landing/Code'

import {
    GetServerSideProps,
    GetServerSidePropsContext,
    InferGetServerSidePropsType,
} from 'next'
import { getOrgLimitsAndSubs, requireAuth } from 'website/src/lib/ssr'

import { Alert, Block, BlockWithStep, CopyButton } from 'beskar/dashboard'
import { env } from 'db/env'
import { prisma } from 'db/prisma'
import router, { useRouter } from 'next/router'
import { generateCodeSnippet } from 'website/src/lib/utils'
import { Divider } from 'beskar/landing'
import {
    Button,
    Code,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    RadioGroup,
    Tab,
    Tabs,
    useDisclosure,
} from '@nextui-org/react'
import { ShowMore } from 'website/src/components/ShowMore'
import { useProps, useThrowingFn } from 'website/src/lib/hooks'
import { createPortalNoCode } from 'website/src/pages/api/functions'
import { set, useForm } from 'react-hook-form'
import { RadioCard } from 'website/src/components/form'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Page({
    site,
    subs,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const router = useRouter()

    return (
        <div className='flex flex-col gap-6'>
            <div className='text-3xl font-bold'>Setup</div>
            <Block>
                <div className=''>
                    You can create a Portal URL to send to your customers to
                    setup SSO without writing any code
                </div>
                <CreatePortalButton />
            </Block>
            <Divider
                className='pt-10'
                heading={
                    <div className='opacity-70'>
                        Or integrate inside your app
                    </div>
                }
            />
            <ApiIntegration />
        </div>
    )
}

function CreatePortalButton() {
    const { site } = useProps()
    const router = useRouter()
    const { slug, orgId } = router.query as any
    const { isOpen, onClose, onOpen, onOpenChange } = useDisclosure()
    const {
        register,
        handleSubmit,
        watch,
        trigger,
        reset,
        setValue,
        formState: { errors, isSubmitting, isValid },
    } = useForm({
        defaultValues: {
            identifier: '', // 'exampleTeamId' // TODO wait for https://github.com/nextui-org/nextui/issues/1395
            callbackUrl: '',
        },
    })
    useEffect(() => {
        if (!isOpen) {
            setUrl('')
            reset()
        }
    }, [isOpen])
    const [url, setUrl] = useState('')
    const { fn: createPortal, isLoading } = useThrowingFn({
        async fn({ callbackUrl, identifier }) {
            const { secret } = site
            const { url } = await createPortalNoCode({
                secret,
                callbackUrl,
                identifier,
            })
            setUrl(url)
        },
    })
    return (
        <>
            <Button onClick={onOpen} color='primary'>
                Create Admin Portal URL
            </Button>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent
                    className='md:min-w-[700px] p-6'
                    onSubmit={handleSubmit(createPortal)}
                    as={'form'}
                >
                    <ModalHeader className='flex flex-col gap-1'>
                        Admin Portal Session
                    </ModalHeader>
                    {!url ? (
                        <>
                            <ModalBody className='gap-4 '>
                                <div className='font-semibold'>identifier</div>
                                <div className='opacity-80 text-sm leading-relaxed'>
                                    The identifier of the company you are
                                    sending the url to, will be passed back to
                                    the <span className=''>callbackUrl</span>
                                </div>
                                <Input
                                    // defaultValue={'exampleTeamId'}
                                    {...register('identifier', {
                                        required: true,
                                    })}
                                />
                                <div className='text-red-400'>
                                    {errors?.identifier?.message}
                                </div>
                                <div className='font-semibold'>callbackUrl</div>

                                <div className='opacity-80 text-sm leading-relaxed'>
                                    The Akarso portal will redirect the user to
                                    this url after completing the SSO setup,
                                    passing the identifier and the other SSO
                                    data.
                                </div>

                                <Input
                                    type='url'
                                    placeholder='https://example.com/akarso-callback'
                                    {...register('callbackUrl', {
                                        required: true,
                                    })}
                                />
                                <div className='text-red-400'>
                                    {errors?.callbackUrl?.message}
                                </div>
                            </ModalBody>
                            <ModalFooter className='items-center'>
                                <Button
                                    type='submit'
                                    isLoading={isLoading}
                                    color='primary'
                                >
                                    Create Portal URL
                                </Button>
                            </ModalFooter>
                        </>
                    ) : (
                        <ModalBody className='space-y-3'>
                            <div className=''>
                                Send the following URL to your customer to let
                                them setup SSO
                            </div>

                            <Input
                                className='font-mono text-sm'
                                labelPlacement='outside'
                                endContent={<CopyButton text={url} />}
                                value={url}
                                // label={label}
                                isReadOnly
                            ></Input>

                            <Alert
                                isVertical
                                title={
                                    'To sync the SSO state in your database:'
                                }
                                description={
                                    <p className='text-sm'>
                                        After the customer completes the SSO
                                        setup, you can store the customer
                                        ssoProviderId in your callbackUrl{' '}
                                        <Link
                                            href='https://docs.akarso.co/'
                                            className='underline'
                                        >
                                            here
                                        </Link>
                                    </p>
                                }
                            />
                            {/* <ModalFooter></ModalFooter> */}
                        </ModalBody>
                    )}
                </ModalContent>
            </Modal>
        </>
    )
}

function ApiIntegration() {
    const router = useRouter()
    const { site } = useProps()
    const host = `${site.slug}.${env.NEXT_PUBLIC_TENANTS_DOMAIN}`

    const { callbackCode, redirectCode, loginCode } = generateCodeSnippet({
        host,
        secret: site.secret,
    })
    const exampleLink = `https://github.com/remorses/akarso/blob/62bedda2347bfc387a0c4846c6a41ea8e6aba7af/website/src/pages/api/functions.ts#L113`

    return (
        <ShowMore className='-mx-6 px-6' height={500}>
            <div className='grow [&>*]:!max-w-full w-full  flex flex-col'>
                <BlockWithStep step={1}>
                    <div className=''>Install the akarso npm package</div>
                    <BigCode
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
                                You should call these akarso functions only in
                                the server
                            </div>
                        }
                    />
                    <BigCode
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
                    <BigCode
                        language='js'
                        className='text-sm'
                        code={callbackCode}
                    />
                </BlockWithStep>
                <BlockWithStep isLast step={4}>
                    <div className=''>Users can now sign in with SSO</div>
                    <BigCode
                        language='js'
                        className='text-sm'
                        code={loginCode}
                    />

                    {/* <Link href={`/org/${orgId}/site/${slug}/customize`}>
            <Button>Customize Portal</Button>
        </Link> */}
                </BlockWithStep>
                <div className=''>
                    You can see a full example application written in Next.js{' '}
                    <a className='underline' href={exampleLink} target='_blank'>
                        here
                    </a>
                </div>
            </div>
        </ShowMore>
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
