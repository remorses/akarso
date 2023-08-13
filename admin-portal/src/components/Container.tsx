'use client'
import { useSetupParams } from 'admin-portal/src/lib/hooks'
import Link from 'next/link'

export function Container({ children }) {
    let { logoUrl, token, hash, color = '' } = useSetupParams()
    color = color.replace('hsl(', '').replace(')', '').replace(/,/g, '')

    return (
        <div className='flex min-h-screen light gap-12 flex-col justify-start h-full w-full items-stretch max-w-[1300px] mx-auto px-16'>
            {color && (
                <style>
                    {`
                        *.light {
                            --nextui-primary: ${color};
                        }
                    `}
                </style>
            )}
            <div className='flex py-6 gap-12 items-center'>
                <Link href={`/token/${token}`} className='font-bold text-3xl'>
                    {logoUrl && <img src={logoUrl} className='h-8' />}
                </Link>
                <div className='grow'></div>
                {/* <div className=''>Link</div>
                <div className=''>Link</div>
                <div className=''>Link</div> */}
            </div>
            {children}

            <div className=' grow'></div>
            <PoweredBy />
            <div className=''></div>
        </div>
    )
}

export function PoweredBy() {
    return (
        <div className='flex self-center opacity-80 tracking-wide text-[12px] gap-1'>
            Powered by
            <a href='https://akarso.co' target='_blank' className='font-bold'>
                Akarso
            </a>
        </div>
    )
}
