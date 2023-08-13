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

import { Radio, cn, Checkbox, RadioGroup, Button } from '@nextui-org/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Provider, providers } from 'admin-portal/src/lib/providers'
import {
    domainAtom,
    metadataUrlAtom,
    metadataXmlAtom,
} from 'admin-portal/src/lib/atoms'
import { createStepPath } from 'admin-portal/src/lib/utils'
import { Container } from 'admin-portal/src/components/Container'
import { useSetupParams, useThrowingFn } from 'admin-portal/src/lib/hooks'
import { createSSOProvider } from 'admin-portal/src/pages/api/functions'

export default function Page({
    params: { provider, step, host, token: hash },
}) {
    step = Number(step)
    const p = providers[provider]
    const stepsLength = p.steps.length
    const isEnd = step - 1 === stepsLength - 1
    const stepObj = p.steps[step - 1]
    const metadataXml = useStore(metadataXmlAtom)
    const metadataUrl = useStore(metadataUrlAtom)
    const { callbackUrl, token } = useSetupParams()

    const { fn: create, isLoading } = useThrowingFn({
        async fn() {
            if (disabled) {
                return alert('Please fill in the metadata url and xml')
            }
            const { url } = await createSSOProvider({
                hash,
                metadataUrl,
                domain: domainAtom.get(),
                metadataXml,
            })
            window.location.href = url
        },
    })
    const [disabled, setDisabled] = useState(true)
    useEffect(() => {
        const disabled =
            'addsMetadata' in stepObj &&
            stepObj.addsMetadata &&
            !metadataXml &&
            !metadataUrl
        setDisabled(disabled)
    }, [metadataUrl, metadataXml])
    // console.log({ disabled, metadataUrl, metadataXml })
    return (
        <Container>
            <div className='flex h-full justify-between gap-12'>
                <div className='flex flex-col gap-6 shrink-0 leading-relaxed max-w-[800px]'>
                    <h1 className='font-semibold text-2xl'>{stepObj.title}</h1>
                    {stepObj.content}
                    <div className='flex'>
                        {/* <div className='grow'></div> */}
                        {!isEnd ? (
                            <Link
                                legacyBehavior
                                href={createStepPath({
                                    host,
                                    provider,
                                    step: step + 1,
                                    hash,
                                })}
                            >
                                <Button
                                    type='button'
                                    endContent={
                                        <ArrowRightIcon className='w-4' />
                                    }
                                    key={disabled}
                                    isDisabled={disabled}
                                    color='primary'
                                    // color='success'
                                    // variant='flat'
                                >
                                    Next Step
                                </Button>
                            </Link>
                        ) : (
                            <Button
                                isLoading={isLoading}
                                onClick={create}
                                color='primary'
                                key={disabled}
                                isDisabled={disabled}
                                endContent={<ArrowRightIcon className='w-4' />}
                            >
                                Finish Setup
                            </Button>
                        )}
                    </div>
                </div>
                <div className='flex sticky self-start top-4 flex-col mt-1 gap-6 shrink-0 min-w-[260px]'>
                    <div className='flex gap-3 items-center'>
                        <div className='[&>*]:w-[20px]'>{p.icon}</div>
                        <div className='text-xl font-semibold'>{p.name}</div>
                    </div>
                    {p.steps.map((stepObj, index) => {
                        const done = index < step - 1
                        const active = index === step - 1
                        return (
                            <Link
                                href={createStepPath({
                                    host,
                                    provider,
                                    step: index + 1,
                                    hash,
                                })}
                                className='flex text-sm items-center  gap-2'
                                key={stepObj.title}
                            >
                                <div
                                    className={cn(
                                        'w-[20px] h-[20px] text-sm flex items-center shadow-sm justify-center font-mono rounded-full border-gray-800 border-full',
                                        active
                                            ? 'bg-gray-900 text-white'
                                            : done
                                            ? 'bg-primary/20 '
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
