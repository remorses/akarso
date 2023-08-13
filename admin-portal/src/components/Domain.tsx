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

export function ChooseProvider() {
    const [domain, setDomain] = useState('')
    const { host, token } = useParams()!
    const router = useRouter()
    return (
        <Container>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    router.push(`/token/${token}/select-provider`)
                }}
                className='flex w-[600px] self-center flex-col gap-12'
            >
                <div className=''>What is your SSO provider?</div>
                <Input
                    onValueChange={setDomain}
                    value={domain}
                    type='text'
                    placeholder='example.com'
                />
                <Button isDisabled={!domain} color='primary' type='submit'>
                    Continue
                </Button>
            </form>
        </Container>
    )
}
