'use client'
import { Container } from 'admin-portal/src/components/Container'
import { RadioCard } from 'admin-portal/src/components/form'
import { providers } from 'admin-portal/src/lib/providers'
import { createStepPath } from 'admin-portal/src/lib/utils'
import {
    Button,
    Checkbox,
    Radio,
    RadioGroup,
    Tooltip,
    cn,
} from '@nextui-org/react'
import { useParams, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

export function ChooseProvider() {
    const [provider, setProvider] = useState('')
    const { host, hash: hash } = useParams()!
    const [pending, startTransition] = useTransition()
    const router = useRouter()
    return (
        <Container>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    startTransition(() => {
                        router.push(
                            createStepPath({ host, provider, step: 1, hash }),
                        )
                    })
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
                        if (disabled) {
                            return (
                                <Tooltip
                                    delay={400}
                                    closeDelay={0}
                                    showArrow
                                    key={key}
                                    content='Coming Soon'
                                >
                                    <div className=''>
                                        <RadioCard
                                            isDisabled={disabled}
                                            icon={value.icon}
                                            value={key}
                                        >
                                            {value.name}
                                        </RadioCard>
                                    </div>
                                </Tooltip>
                            )
                        }
                        return (
                            <RadioCard key={key} icon={value.icon} value={key}>
                                {value.name}
                            </RadioCard>
                        )
                    })}
                </RadioGroup>
                <Button
                    isDisabled={!provider}
                    isLoading={pending}
                    color='primary'
                    type='submit'
                >
                    Continue
                </Button>
            </form>
        </Container>
    )
}
