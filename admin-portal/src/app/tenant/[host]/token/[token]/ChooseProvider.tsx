'use client'
import { Container } from '@/components/Container'
import { RadioCard } from '@/components/form'
import { providers } from '@/lib/providers'
import { createStepPath } from '@/lib/utils'
import { Button, Checkbox, Radio, RadioGroup, cn } from '@nextui-org/react'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

export function ChooseProvider() {
    const [provider, setProvider] = useState('')
    const { host, token } = useParams()!
    const router = useRouter()
    return (
        <Container>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    router.push(createStepPath({ host, provider, step: 1, token }))
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
                        return (
                            <RadioCard key={key} icon={value.icon} value={key}>
                                {value.name}
                            </RadioCard>
                        )
                    })}
                </RadioGroup>
                <Button type='submit'>Continue</Button>
            </form>
        </Container>
    )
}


