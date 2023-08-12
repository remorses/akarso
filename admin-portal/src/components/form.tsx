import { Checkbox, Radio, cn } from '@nextui-org/react'

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
