'use client'
import { Container } from '@/components/Container'
import { useSetupParams } from '@/lib/hooks'
import Link from 'next/link'

export function SessionExpired({}) {
    const { websiteUrl = '' } = useSetupParams()
    const host = new URL(websiteUrl || '').host
    return (
        <Container>
            <div className='flex text-center h-full pt-24 gap-6 flex-col items-center justify-center'>
                <div className='text-3xl'>
                    This Admin Portal session expired
                </div>
                <div className='text-xl opacity-70'>
                    go back to{' '}
                    <Link className='underline' href={websiteUrl!}>
                        {host}
                    </Link>{' '}
                    to create a new one
                </div>
            </div>
        </Container>
    )
}
