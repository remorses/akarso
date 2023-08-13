'use client'
import { useSetupParams } from 'admin-portal/src/lib/hooks'
import Link from 'next/link'

export function Container({ children }) {
    let { logoUrl, token, hash, color = '' } = useSetupParams()
    color = color.replace('hsl(', '').replace(')', '').replace(/,/g, '')

    return (
        <div className='flex light gap-12 flex-col justify-center h-full w-full items-stretch max-w-[1300px] mx-auto px-16'>
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
            <div className='pt-24'></div>
        </div>
    )
}
