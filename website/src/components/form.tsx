import {
    Button,
    Checkbox,
    Popover,
    PopoverContent,
    PopoverTrigger,
    Radio,
    cn,
} from '@nextui-org/react'
import { Control, useController } from 'react-hook-form'
import { ColorResult, SketchPicker } from 'react-color'

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

export function ColorPicker({
    onChange,
    value,
    children,
    defaultValue,
}) {
    function colorString(c: ColorResult) {
        return `rgba(${c.rgb.r},${c.rgb.g},${c.rgb.b},${c.rgb.a || 1})`
    }

    return (
        <Popover isLazy>
            <PopoverTrigger>
                <Button className='flex gap-2' >
                    {children}
                    <div
                        style={{ background: value }}
                        className='w-4 h-4 shadow rounded '
                    ></div>
                </Button>
            </PopoverTrigger>

            <PopoverContent className='select-none !bg-transparent !border-0 min-w-0 max-w-max'>
                <SketchPicker
                    className=''
                    onChange={(c) => {
                        onChange(colorString(c))
                    }}
                    onChangeComplete={(c) => {
                        onChange(colorString(c))
                        
                    }}
                    // onBlur={onBlur as any}
                    color={value || defaultValue}
                    // ref={ref}
                />
            </PopoverContent>
        </Popover>
    )
}
