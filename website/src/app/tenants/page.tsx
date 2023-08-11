'use client'
import { Google, Microsoft, Okta } from '@/app/tenants/icons'
import { providers } from '@/lib/providers'
import { Radio, cn, Checkbox, RadioGroup, Button } from '@nextui-org/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Page() {
    return (
        <Container>
            <ChooseProvider />
        </Container>
    )
}

export function Container({ children }) {
    return (
        <div className='flex gap-12 flex-col pt-12 justify-center h-full w-full items-stretch max-w-[1200px] mx-auto px-12'>
            <div className='flex py-6 gap-12 items-center'>
                <div className='font-bold text-3xl'>Logo</div>
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

export function ChooseProvider() {
    const [provider, setProvider] = useState('')
    const router = useRouter()
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                router.push(`/tenants/provider/${provider}/step/1`)
            }}
            className='flex flex-col gap-12'
        >
            <RadioGroup value={provider} onValueChange={setProvider}>
                {Object.entries(providers).map(([key, value]) => {
                    return (
                        <RadioCard icon={value.icon} value={key}>
                            {value.name}
                        </RadioCard>
                    )
                })}
            </RadioGroup>
            <Button type='submit'>Continue</Button>
        </form>
    )
}

export const RadioCard = (props) => {
    const { children, icon, ...otherProps } = props

    return (
        <Radio
            {...otherProps}
            classNames={{
                base: cn(
                    'flex m-0 bg-content2 min-w-full hover:bg-content2 items-center justify-between',
                    'flex-row-reverse cursor-pointer rounded-lg gap-4 p-4 border-2 border-transparent',
                    'data-[selected=true]:border-primary',
                ),
            }}
        >
            <div className='flex gap-2'>
                <div className='[&>*]:w-[30px]'>{icon}</div>
                <div className=''>{children}</div>
            </div>
        </Radio>
    )
}

export const CheckboxCard = (props) => {
    const { children, description, ...otherProps } = props

    return (
        <Checkbox
            {...otherProps}
            classNames={{
                base: cn(
                    'flex m-0 bg-content2 min-w-full hover:bg-content2 items-center justify-between',
                    'flex-row-reverse cursor-pointer rounded-lg gap-4 p-4 border-2 border-transparent',
                    'data-[selected=true]:border-primary',
                ),
            }}
        >
            <div className=''>
                <div className=''>{children}</div>
                <div className='text-sm opacity-60'>{description}</div>
            </div>
        </Checkbox>
    )
}
