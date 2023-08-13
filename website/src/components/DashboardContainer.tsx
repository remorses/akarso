import { Tab, Tabs, cn } from '@nextui-org/react'
// import { TabLink } from 'beskar/src/Tabs'

import { Select } from 'beskar/src/Select'
import { useUser } from '@supabase/auth-helpers-react'

import {
    ArrowLeft,
    HomeIcon,
    Link2Icon,
    ScissorsIcon,
    Settings2Icon,
} from 'lucide-react'
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
                <Link className='flex flex-col' href={'/onboarding'}>
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
    const base = `/org/${orgId}/site/${slug}`
    return (
        <div className='pb-24 '>
            {/* <div className='w-full '>
                <div className='w-full max-w-[1200px] mx-auto'>
                    <MyNavbar />
                </div>
            </div> */}
            <div className='w-full flex max-w-[1200px] pt-24 gap-12 mx-auto'>
                <div className='flex flex-col w-[220px] sticky top-4 gap-6 shrink-0 self-start'>
                    <div className='text-2xl absolute -top-12 font-bold'>
                        akarso.
                    </div>
                    <SelectOrg slug={slug} sites={sites} />
                    <Tabs
                        variant='light'
                        disabledKeys={[
                            // base + '/customize', //
                            base + '/settings', //
                            base + '/domain', //
                        ]}
                        aria-label='nav'
                        classNames={{
                            tabList: 'w-[200px] items-start flex-col ',

                            cursor: 'w-full bg-gray-200 text-gray-900 shadow-none',

                            tab: 'justify-start ',
                            // tabContent: '',
                        }}
                        selectedKey={router.asPath}
                        onSelectionChange={(x) => {
                            router.push(x)
                        }}
                    >
                        <Tab
                            key={base}
                            title={
                                <div className='flex items-center gap-2'>
                                    <HomeIcon className='w-4' />
                                    Setup
                                </div>
                            }
                        ></Tab>
                        <Tab
                            key={base + '/customize'}
                            title={
                                <div className='flex items-center gap-2'>
                                    <ScissorsIcon className='w-4' />
                                    Customize
                                </div>
                            }
                        ></Tab>

                        <Tab
                            key={base + '/domain'}
                            title={
                                <div className='flex items-center gap-2'>
                                    <Link2Icon className='w-4' />
                                    Custom Domain
                                </div>
                            }
                        ></Tab>
                        <Tab
                            key={base + '/settings'}
                            title={
                                <div className='flex items-center gap-2'>
                                    <Settings2Icon className='w-4' />
                                    Settings
                                </div>
                            }
                        ></Tab>
                    </Tabs>
                </div>
                <div className='flex grow flex-col items-stretch -mt-1 gap-6'>
                    {children}
                </div>
            </div>
        </div>
    )
}