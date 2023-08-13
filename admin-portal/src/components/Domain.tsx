'use client'
import { Container } from 'admin-portal/src/components/Container'
import { RadioCard } from 'admin-portal/src/components/form'
import { providers } from 'admin-portal/src/lib/providers'
import { createStepPath } from 'admin-portal/src/lib/utils'
import {
    Button,
    Checkbox,
    Input,
    Radio,
    RadioGroup,
    cn,
} from '@nextui-org/react'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useStore } from '@nanostores/react'
import { domainAtom } from '@/lib/atoms'
import Link from 'next/link'

export function Domain() {
    const domain = useStore(domainAtom)
    const { host, token } = useParams()!
    const router = useRouter()

    return (
        <Container>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    router.push(`/token/${token}/select-provider`)
                }}
                className='flex w-[600px] self-center flex-col gap-6'
            >
                <div className=''>What is your SSO domain?</div>
                <Input
                    onValueChange={(x) => domainAtom.set(x)}
                    value={domain}
                    type='text'
                    placeholder='example.com'
                />
                <Link legacyBehavior href={`/token/${token}/select-provider`}>
                    <Button isDisabled={!domain} color='primary' type='submit'>
                        Continue
                    </Button>
                </Link>
            </form>
        </Container>
    )
}
