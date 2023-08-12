'use client'
import { useStore } from '@nanostores/react'

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
import { Provider, providers } from '@/lib/providers'
import { metadataXml } from '@/lib/atoms'

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
    const stepObj = p.steps[step - 1]
    const metadata = useStore(metadataXml)
    return (
        <Container>
            <div className='flex h-full justify-between gap-12'>
                <div className='flex flex-col gap-4 shrink-0  leading-relaxed w-[700px]'>
                    <h1 className='font-semibold text-2xl'>{stepObj.title}</h1>
                    {stepObj.content}
                    <div className='flex'>
                        {/* <div className='grow'></div> */}
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
                                    className={cn(
                                        stepObj['addsMetadata'] &&
                                            !metadata &&
                                            'pointer-events-none opacity-70',
                                    )}
                                    // color='success'
                                    // variant='flat'
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
                <div className='flex sticky self-start top-4 flex-col gap-6 shrink-0 min-w-[260px]'>
                    <div className='flex gap-3 items-center'>
                        <div className='[&>*]:w-[20px]'>{p.icon}</div>
                        <div className='text-xl font-semibold'>{p.name}</div>
                    </div>
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
            </div>
        </Container>
    )
}
