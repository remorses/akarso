import { useThrowingFn } from 'beskar/landing'
import useSwr from 'swr'
import { BlockWithStep } from 'beskar/dashboard'

import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next'
import { requireAuth } from 'website/src/lib/ssr'

import { Button, Input, Radio, cn } from '@nextui-org/react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { OnboardingContainer } from 'website/src/components/OnboardingContainer'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { SimpleSelect } from 'website/src/components/SimpleSelect'
import {
    getSupabaseProjects,
    onboarding,
} from 'website/src/pages/api/functions'
import { toast } from 'react-hot-toast'
import { slugKebabCase } from 'website/src/lib/utils'

export default function Page({}) {
    const router = useRouter()
    const { fn: onSubmit, isLoading } = useThrowingFn({
        async fn(data) {
            console.log(data)
            const { orgId, slug } = await onboarding(data)
            router.push(`/org/${orgId}/site/${slug}`)
        },
    })

    const {
        register,
        handleSubmit,
        watch,
        trigger,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: {
            supabaseAccessToken: '',
            supabaseProjectRef: '',
            slug: '',
        },
    })
    const { slug, supabaseAccessToken, supabaseProjectRef } = watch()
    const {
        data: projects,
        isValidating,
        error,
    } = useSwr(
        [supabaseAccessToken],
        async ([supabaseAccessToken]) => {
            const proj = await getSupabaseProjects({ supabaseAccessToken })
            return proj
        },
        {
            onError: (err) => {
                toast.error(err.message)
            },
        },
    )
    // params to take: supabase token, site slug (will also be org name, ), logo, and domain
    return (
        <OnboardingContainer>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className='flex flex-col gap-8'
            >
                <BlockWithStep step={1} className=''>
                    <div className=''>Choose a slug for your team</div>
                    <Input
                        {...register('slug', {
                            required: true,
                            setValueAs(value) {
                                return slugKebabCase(value)
                            },
                        })}
                        isRequired
                        placeholder='Holocron'
                    />
                </BlockWithStep>
                <BlockWithStep step={2} className=''>
                    <div className=''>
                        Supabase token, you can generate one{' '}
                        <Link
                            href={`https://supabase.com/dashboard/account/tokens`}
                            className='underline'
                        >
                            here
                        </Link>
                    </div>
                    <Input
                        {...register('supabaseAccessToken', { required: true })}
                        isRequired
                        type='password'
                        placeholder='xxxxxx'
                    />
                </BlockWithStep>
                <BlockWithStep step={3} className=''>
                    <div className=''>Supabase project</div>
                    <SimpleSelect.Container className=''>
                        <SimpleSelect.Select
                            {...register('supabaseProjectRef', {
                                required: true,
                            })}
                        >
                            {projects?.map((t, index) => (
                                <option key={index} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </SimpleSelect.Select>
                        <SimpleSelect.Icon />
                    </SimpleSelect.Container>
                </BlockWithStep>

                <BlockWithStep isLast step={2} className=''>
                    <div className='flex flex-col items-center space-y-4'>
                        <Button
                            className='min-w-[20ch]'
                            type='submit'
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

    return {
        props: {},
    }
}
