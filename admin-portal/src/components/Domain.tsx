'use client'
import { ButtonLink } from '@/components/form'
import { domainAtom } from '@/lib/atoms'
import { useStore } from '@nanostores/react'
import { Button, Input } from '@nextui-org/react'
import { Container } from 'admin-portal/src/components/Container'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function Domain() {
    const domain = useStore(domainAtom)
    const { host, hash } = useParams()!
    const router = useRouter()
    const [error, setError] = useState<string>('')
    const [disabled, setDisabled] = useState(true)
    useEffect(() => {
        const disabled = error || !domain
        setDisabled(!!disabled)
    }, [domain, error])
    return (
        <Container>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    router.push(`/session/${hash}/select-provider`)
                }}
                className='flex w-[500px] self-center flex-col gap-6'
            >
                <div className=''>What is your SSO domain?</div>
                <Input
                    onValueChange={(x) => {
                        if (!x.includes('.')) {
                            setError('Invalid domain')
                        } else {
                            setError('')
                        }
                        domainAtom.set(x)
                    }}
                    value={domain}
                    type='text'
                    placeholder='example.com'
                />
                {error && <div className='text-red-400 text-sm'>{error}</div>}

                <ButtonLink
                    href={`/session/${hash}/select-provider`}
                    isDisabled={disabled}
                    color='primary'
                    type='submit'
                >
                    Continue
                </ButtonLink>
            </form>
        </Container>
    )
}
