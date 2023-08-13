'use client'
import { domainAtom } from '@/lib/atoms'
import { useStore } from '@nanostores/react'
import { Button, Input } from '@nextui-org/react'
import { Container } from 'admin-portal/src/components/Container'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

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
                className='flex w-[500px] self-center flex-col gap-6'
            >
                <div className=''>What is your SSO domain?</div>
                <Input
                    onValueChange={(x) => domainAtom.set(x)} // TODO validate domain
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
