import { Button, Checkbox, Radio, cn } from '@nextui-org/react'
import NextLink from 'next/link'
import { useRouter } from 'next/navigation'
import {
    ComponentPropsWithRef,
    ComponentPropsWithoutRef,
    startTransition,
    useTransition,
} from 'react'

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

export const ButtonLink = ({
    href,
    ...rest
}: ComponentPropsWithoutRef<typeof Button>) => {
    const [pending, startTransition] = useTransition()
    const router = useRouter()
    return (
        <NextLink href={href} legacyBehavior>
            <Button
                isLoading={pending}
                
                onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey) return
                    e.preventDefault()
                    e.stopPropagation()
                    startTransition(() => {
                        router.push(href)
                    })
                }}
                {...rest}
            />
        </NextLink>
    )
}
