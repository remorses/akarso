'use client'
import { CheckSquareIcon } from 'lucide-react'
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
                title: `Add Custom SAML Application`,
                content: (
                    <>
                        <div>
                            In your Google Admin dashboard, select "Apps" from
                            the sidebar menu, and then select "Web and Mobile
                            Apps" from the list. On this page, select "Add App"
                            and then "Add custom SAML app".
                        </div>
                        <Image
                            alt='Add custom SAML app'
                            src={require('@/ssoimg/google/1.png')}
                        />
                    </>
                ),
            },
        ],
    },
} as const

export function Img({ src, ...rest }) {
    return <Image className='rounded w-full' src={src} alt='' {...rest} />
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
    return (
        <Container>
            <div className='flex gap-12'>
                <div className='flex flex-col gap-6 min-w-[240px]'>
                    {p.steps.map((step, index) => {
                        return (
                            <Link
                                href={`/tenants/provider/${provider}/step/${
                                    index + 1
                                }`}
                                className='flex text-sm items-center gap-2'
                                key={step.title}
                            >
                                <CheckSquareIcon className='w-4' />
                                <div className=''>{step.title}</div>
                            </Link>
                        )
                    })}
                </div>
                <div className='flex flex-col gap-6'>
                    {p.steps[step - 1].content}
                </div>
            </div>
        </Container>
    )
}
