import { BlockWithStep } from 'beskar/dashboard'
import { useThrowingFn } from 'beskar/landing'
import useSwr from 'swr'

import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next'
import { requireAuth } from 'website/src/lib/ssr'

import { Button, Input, Radio, cn } from '@nextui-org/react'
import { env } from 'db/env'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useForm } from 'react-hook-form'
import useFormPersist from 'react-hook-form-persist'
import { OnboardingContainer } from 'website/src/components/OnboardingContainer'
import { SimpleSelect } from 'website/src/components/SimpleSelect'
import { slugKebabCase } from 'website/src/lib/utils'
import {
    getSupabaseProjects,
    onboarding,
} from 'website/src/pages/api/functions'

export default function Page({ supabaseAccessToken, supabaseRefreshToken }) {
    const router = useRouter()
    const { fn: onSubmit, isLoading } = useThrowingFn({
        async fn(data) {
            console.log(data)
            if (!supabaseRefreshToken) {
                throw new Error('No supabase refresh token')
            }
            const { orgId, slug } = await onboarding({
                ...data,
                supabaseRefreshToken,
                supabaseAccessToken,
            })
            router.push(`/org/${orgId}/site/${slug}`)
        },
    })

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
            supabaseProjectRef: '',
            websiteUrl: '',
            slug: '',
        },
    })

    const data = watch()
    const { slug, supabaseProjectRef } = data
    const {
        data: projects,
        isValidating,
        error,
    } = useSwr(
        [supabaseAccessToken],
        async ([supabaseAccessToken]) => {
            if (!supabaseAccessToken) {
                return []
            }
            const proj = await getSupabaseProjects({ supabaseAccessToken })
            return proj
        },
        {
            onError: (err) => {
                console.error(err.message)
            },
        },
    )

    useFormPersist('onboarding', {
        watch,
        storage: globalThis?.window?.localStorage,
        setValue,
    })

    const supabaseUrl = new URL(`/api/supabase/connect`, env.NEXT_PUBLIC_URL)
    supabaseUrl.searchParams.set(
        'redirectUrl',
        new URL(router.asPath, env.NEXT_PUBLIC_URL).toString(),
    )

    // params to take: supabase token, site slug (will also be org name, ), logo, and domain
    return (
        <OnboardingContainer>
            {/* <pre className=''>{JSON.stringify(data)}</pre> */}
            <form
                onSubmit={handleSubmit(onSubmit)}
                className='flex flex-col self-center gap-2'
            >
                <BlockWithStep step={0} className=''>
                    <div className=''>What is your company url?</div>
                    <Input
                        startContent={
                            <div className='pointer-events-none flex items-center'>
                                <span className='text-default-400 text-small'>
                                    https://
                                </span>
                            </div>
                        }
                        isRequired
                        placeholder='example.com'
                        description={errors.websiteUrl?.message}
                        {...register('websiteUrl', {
                            required: true,
                            validate(x) {
                                if (!x.includes('.')) {
                                    return 'Must be a valid domain'
                                }
                            },

                            // onChange(e) {
                            //     e.target.value = slugKebabCase(e.target.value)
                            // },
                        })}
                    />
                </BlockWithStep>
                <BlockWithStep step={1} className=''>
                    <div className=''>Choose a slug for your Admin Portal</div>
                    <Input
                        endContent={
                            <div className='pointer-events-none flex items-center'>
                                <span className='text-default-400 text-small'>
                                    .{env.NEXT_PUBLIC_TENANTS_DOMAIN}
                                </span>
                            </div>
                        }
                        isRequired
                        {...register('slug', {
                            required: true,
                            setValueAs(value) {
                                return slugKebabCase(value)
                            },
                            // onChange(e) {
                            //     e.target.value = slugKebabCase(e.target.value)
                            // },
                        })}
                        placeholder='holocron'
                    />
                </BlockWithStep>
                <BlockWithStep step={2} className=''>
                    <div className=''>Connect Supabase</div>
                    <Link legacyBehavior href={supabaseUrl.toString()}>
                        <Button>
                            {supabaseAccessToken
                                ? 'Update Supabase Integration'
                                : `Connect Supabase`}
                        </Button>
                    </Link>
                </BlockWithStep>
                <BlockWithStep
                    disabled={!supabaseAccessToken || !projects?.length}
                    step={3}
                    className=''
                >
                    <div className=''>Supabase project</div>
                    <div className=''>
                        <SimpleSelect.Container className='!w-full '>
                            <SimpleSelect.Select
                                className={cn('')}
                                {...register('supabaseProjectRef', {
                                    required: true,
                                })}
                            >
                                {projects?.map((t, index) => (
                                    <option key={index} value={t.id}>
                                        {t.org}/{t.name}
                                    </option>
                                ))}
                                {!projects?.length && (
                                    <option key='last' value={''}>
                                        {isValidating
                                            ? 'loading...'
                                            : 'No Projects'}
                                    </option>
                                )}
                            </SimpleSelect.Select>
                            <SimpleSelect.Icon />
                        </SimpleSelect.Container>
                    </div>
                </BlockWithStep>

                <BlockWithStep disabled={!isValid} isLast step={4} className=''>
                    <div className='flex flex-col items-center space-y-4'>
                        <Button
                            className='min-w-[20ch]'
                            type='submit'
                            isDisabled={!isValid || isValidating}
                            isLoading={isLoading}
                        >
                            Create Admin Portal
                        </Button>
                    </div>
                </BlockWithStep>
            </form>
        </OnboardingContainer>
    )
}

export const RadioCard = (props) => {
    const { children, ...otherProps } = props

    return (
        <Radio
            {...otherProps}
            classNames={{
                base: cn(
                    'flex m-0 bg-content2 min-w-full hover:bg-content2 items-center justify-between',
                    'flex-row-reverse cursor-pointer rounded-lg gap-4 p-4 border-2 border-transparent',
                    'data-[selected=true]:border-primary',
                ),
            }}
        >
            {children}
        </Radio>
    )
}

export async function getServerSideProps(
    ctx: GetServerSidePropsContext,
): Promise<GetServerSidePropsResult<any>> {
    const { supabase, session, redirect } = await requireAuth(ctx)
    const userId = session?.user?.id
    if (redirect) {
        return { redirect }
    }

    const supabaseAccessToken = ctx.req.cookies?.supabaseAccessToken || ''
    const supabaseRefreshToken = ctx.req.cookies?.supabaseRefreshToken || ''
    return {
        props: { supabaseAccessToken, supabaseRefreshToken },
    }
}
