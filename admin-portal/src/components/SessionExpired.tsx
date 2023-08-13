import { Container } from '@/components/Container'

export function SessionExpired({}) {
    return (
        <Container>
            <div className='flex text-center h-full pt-24 gap-6 flex-col items-center justify-center'>
                <div className='text-3xl'>
                    This Admin Portal session expired
                </div>
                <div className='text-xl opacity-70'>
                    go back to back to the original service to create a new one
                </div>
            </div>
        </Container>
    )
}
