import { cn } from '@nextui-org/react'

import { Select } from 'beskar/src/Select'
import { useUser } from '@supabase/auth-helpers-react'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { MyNavbar } from 'website/src/components/specific'

function SelectOrg({ sites = [] as { slug: string; orgId: string }[], slug }) {
    const router = useRouter()
    return (
        <Select
            useAutoGradientIcons
            // isLoading={isValidating || isLoading || isOrgLoading}
            value={slug}
            onChange={(x) => {
                const site = sites.find((o) => o.slug === x)
                if (!site) {
                    return
                }
                router.push(`/org/${site.orgId}/site/${site.slug}`)
            }}
            className={cn('min-w-[200px] !border-0')}
            endButton={
                <Link href={'/onboarding'}>
                    <Select.SelectButton children='New Admin Portal' />
                </Link>
            }
            options={sites.map((o) => {
                return {
                    value: o.slug,
                    name: o.slug,
                }
            })}
        />
    )
}

export function DashboardContainer({ children, sites }) {
    const router = useRouter()
    const user = useUser()
    const { orgId, slug } = router.query as any
    return (
        <div className='w-full max-w-[1200px] mx-auto pb-24'>
            <MyNavbar />
            <div className='flex'>
                <SelectOrg slug={slug} sites={sites} />
                <div className='grow'></div>
            </div>
            <div className='flex flex-col gap-6 pt-20 items-stretch'>
                <div
                    className={cn(
                        'rounded-lg items-stretch flex-col',
                        'flex gap-8 min-w-[700px] max-w-full w-',
                    )}
                >
                    {children}
                </div>
            </div>
        </div>
    )
}
