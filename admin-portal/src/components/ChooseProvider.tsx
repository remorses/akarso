'use client'
import { Container } from 'admin-portal/src/components/Container'
import { RadioCard } from 'admin-portal/src/components/form'
import { providers } from 'admin-portal/src/lib/providers'
import { createStepPath } from 'admin-portal/src/lib/utils'
import { Button, Checkbox, Radio, RadioGroup, cn } from '@nextui-org/react'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

export function ChooseProvider() {
    const [provider, setProvider] = useState('')
    const { host, token: hash } = useParams()!
    const router = useRouter()
    return (
        <Container>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    router.push(
                        createStepPath({ host, provider, step: 1, hash }),
                    )
                }}
                className='flex w-[600px] self-center flex-col gap-12'
            >
                <div className=''>What is your SSO provider?</div>
                <RadioGroup
                    description=''
                    value={provider}
                    onValueChange={setProvider}
                >
                    {Object.entries(providers).map(([key, value]) => {
                        const disabled = 'inactive' in value && value.inactive
                        return (
                            <RadioCard
                                isDisabled={disabled}
                                key={key}
                                icon={value.icon}
                                value={key}
                            >
                                {value.name}
                            </RadioCard>
                        )
                    })}
                </RadioGroup>
                <Button isDisabled={!provider} color='primary' type='submit'>
                    Continue
                </Button>
            </form>
        </Container>
    )
}
