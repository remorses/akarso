'use client'
import { domainAtom } from '@/lib/atoms'
import { useStore } from '@nanostores/react'
import { Button, Input } from '@nextui-org/react'
import { Container } from 'admin-portal/src/components/Container'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

export function Domain() {
    const domain = useStore(domainAtom)
    const { host, token } = useParams()!
    const router = useRouter()
    const [error, setError] = useState<string>('')

    return (
        <Container>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    router.push(`/token/${token}/select-provider`)
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
                <Link legacyBehavior href={`/token/${token}/select-provider`}>
                    <Button
                        isDisabled={!domain || !!error}
                        color='primary'
                        type='submit'
                    >
                        Continue
                    </Button>
                </Link>
            </form>
        </Container>
    )
}
