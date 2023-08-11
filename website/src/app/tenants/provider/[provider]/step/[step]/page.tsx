'use client'
import {
    ArrowRight,
    ArrowRightIcon,
    CheckCircle2,
    CheckIcon,
    CheckSquareIcon,
} from 'lucide-react'
import Image from 'next/image'
import { Google, Microsoft, Okta } from '@/app/tenants/icons'
import { Container } from '@/app/tenants/page'
import { Radio, cn, Checkbox, RadioGroup, Button } from '@nextui-org/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

const providers = {
    google: {
        steps: [
            {
                title: `Add Custom SAML Application`,
                content: (
                    <>
                        <div>
                            In your Google Admin dashboard, select "Apps" from
                            the sidebar menu, and then select "Web and Mobile
                            Apps" from the list. On this page, select "Add App"
                            and then "Add custom SAML app".
                        </div>
                        <Img
                            alt='Add custom SAML app'
                            src={require('@/ssoimg/google/1.png')}
                        />
                    </>
                ),
            },
            {
                title: `Enter Details for your Custom App`,
                content: (
                    <>
                        <div>
                            Enter an App name and icon (if applicable) for
                            demo.workos.com, then select "Continue".
                        </div>
                        <Img
                            alt='Add custom SAML app'
                            src={require('@/ssoimg/google/2.png')}
                        />
                    </>
                ),
            },
            {
                title: `Upload Identity Provider Metadata`,
                content: (
                    <>
                        <div>
                            Select the "Download Metadata" button to download
                            the metadata file, and upload it below. Click
                            "Continue".
                        </div>
                        <Img
                            alt='Add custom SAML app'
                            src={require('@/ssoimg/google/3.png')}
                        />
                    </>
                ),
            },
            {
                title: `Enter Service Provider Details`,
                content: (
                    <>
                        <div>
                            Submit the "ACS URL" and the "Entity ID". Click
                            "Continue"
                        </div>
                        <Img
                            alt='Add custom SAML app'
                            src={require('@/ssoimg/google/4.png')}
                        />
                    </>
                ),
            },
            {
                title: `Configure Attribute Mapping`,
                content: (
                    <>
                        <div>
                            Provide the following Attribute Mappings and select
                            "Finish":
                        </div>
                        <Img
                            alt='Add custom SAML app'
                            src={require('@/ssoimg/google/5.png')}
                        />
                    </>
                ),
            },
            {
                title: `Configure User Access`,
                content: (
                    <>
                        <div>
                            In the created SAML applications landing page,
                            select the "User Access Section".
                        </div>
                        <Img
                            alt='Add custom SAML app'
                            src={require('@/ssoimg/google/6.png')}
                        />
                        <div className=''>
                            Turn this service ON for the correct organizational
                            units in your Google Application. Save any changes.
                            Note that Google may take up to 24 hours to
                            propagate these changes, and the connection may be
                            inactive until the changes have propagated.
                        </div>
                        <Img
                            alt='Add custom SAML app'
                            src={require('@/ssoimg/google/7.png')}
                        />
                    </>
                ),
            },
        ],
    },
} as const

export function Img({ src, ...rest }) {
    return (
        <div className='p-6 bg-gray-100 rounded-md'>
            <div className='overflow-hidden items-center flex relative rounded-md flex-col'>
                <Image
                    className='overflow-hidden relative min-w-[105%] shadow '
                    src={src}
                    alt=''
                    {...rest}
                />
            </div>
        </div>
    )
}

export type Provider = keyof typeof providers

export default function Page({
    params: { provider, step },
}: {
    params: {
        provider: Provider
        step: number
    }
}) {
    step = Number(step)
    const p = providers[provider]
    const stepsLength = p.steps.length
    const isEnd = step - 1 !== stepsLength - 1
    return (
        <Container>
            <div className='flex gap-12'>
                <div className='flex flex-col gap-6 min-w-[240px]'>
                    {p.steps.map((stepObj, index) => {
                        const done = index < step - 1
                        const active = index === step - 1
                        return (
                            <Link
                                href={`/tenants/provider/${provider}/step/${
                                    index + 1
                                }`}
                                className='flex text-sm items-center  gap-2'
                                key={stepObj.title}
                            >
                                <div
                                    className={cn(
                                        'w-[20px] h-[20px] text-sm flex items-center shadow-sm justify-center font-mono rounded-full border-gray-800 border-full',
                                        active
                                            ? 'bg-gray-900 text-white'
                                            : done
                                            ? 'bg-green-100 '
                                            : 'bg-gray-100',
                                    )}
                                >
                                    {done ? (
                                        <CheckIcon className='stroke-[3px] h-[13px]' />
                                    ) : (
                                        index + 1
                                    )}
                                </div>

                                <div
                                    className={cn(
                                        'truncate',
                                        active && 'font-semibold',
                                    )}
                                >
                                    {stepObj.title}
                                </div>
                            </Link>
                        )
                    })}
                </div>
                <div className='flex flex-col gap-6 max-w-[700px]'>
                    <h1 className='font-semibold text-2xl'>
                        {p.steps[step - 1].title}
                    </h1>
                    {p.steps[step - 1].content}
                    <div className='flex'>
                        <div className='grow'></div>
                        {isEnd ? (
                            <Link
                                legacyBehavior
                                href={`/tenants/provider/${provider}/step/${
                                    step + 1
                                }`}
                            >
                                <Button
                                    endContent={
                                        <ArrowRightIcon className='w-4' />
                                    }
                                >
                                    Next Step
                                </Button>
                            </Link>
                        ) : (
                            <Link
                                legacyBehavior
                                href={``} // TODO: replace with sign in page
                            >
                                <Button
                                    endContent={
                                        <ArrowRightIcon className='w-4' />
                                    }
                                >
                                    Continue to Sign In
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </Container>
    )
}
