import { cn } from '@nextui-org/react'
import { useUser } from '@supabase/auth-helpers-react'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { MyNavbar } from 'website/src/components/specific'

export function OnboardingContainer({ children }) {
    const router = useRouter()
    const user = useUser()
    const { orgId, siteSlug } = router.query

    return (
        <div className='w-full max-w-[1200px] mx-auto pb-24'>
            <MyNavbar />
            <div className='flex flex-col gap-6 pt-20 items-center'>
                {/* {!!user?.user_metadata?.preferredSite?.siteId && (
                    <Link
                        href={back}
                        className='flex gap-2 text-sm font-semibold'
                    >
                        <ArrowLeft className='w-4' />
                        <div className=''>Back to the editor</div>
                    </Link>
                )} */}
                <div className='flex flex-col items-center h-full '>
                    <div
                        className={cn(
                            'rounded-lg border p-6 items-stretch flex-col',
                            'flex gap-8 min-w-[700px] max-w-full',
                        )}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}
