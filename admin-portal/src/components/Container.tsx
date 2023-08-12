'use client'
import { useSetupParams } from '@/lib/hooks'

export function Container({ children }) {
    const { logoUrl, color } = useSetupParams()
    return (
        <div className='flex gap-12 flex-col justify-center h-full w-full items-stretch max-w-[1200px] mx-auto px-12'>
            <div className='flex py-6 gap-12 items-center'>
                <div className='font-bold text-3xl'>
                    {logoUrl && <img src={logoUrl} className='h-12' />}
                </div>
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
