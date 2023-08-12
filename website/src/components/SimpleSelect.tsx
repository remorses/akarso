import { cn } from '@nextui-org/react'
import classNames from 'classnames'
import { ComponentPropsWithoutRef, forwardRef } from 'react'

const Select = forwardRef<any, ComponentPropsWithoutRef<'select'>>(
    function Select({ className = '', children, ...rest }, ref) {
        return (
            <select
                contentEditable={false}
                ref={ref}
                className={classNames(
                    'shrink-0 min-w-full rounded-lg border bg-white pr-[34px] text-gray-900 shadow-sm ring-gray-300 dark:border-0 dark:bg-gray-800',
                    'block cursor-pointer appearance-none px-3',
                    ' focus:ring-blue-500 dark:text-white dark:ring-gray-700',
                    'dark:placeholder-gray-400 dark:focus:ring-blue-500',
                    'py-[0.2em]',
                    className,
                )}
                {...rest}
            >
                {children}
            </select>
        )
    },
)

function Container({ className = '', ...rest }) {
    return <div className={cn('relative select-none', className)} {...rest} />
}

export function SimpleSelect() {
    throw new Error(`Use static components instead`)
}

const Icon = (props) => {
    const s = '1.4em'
    return (
        <div
            style={{
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                top: '50%',
                right: '6px',
                zIndex: 100,

                // color: 'white',
                transform: 'translateY(-50%)',
            }}
            className=''
        >
            <svg
                viewBox='0 0 24 24'
                style={{ width: s, height: s, opacity: 0.6, flexShrink: 0 }}
                {...props}
            >
                <path
                    fill='currentColor'
                    d='M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z'
                />
            </svg>
        </div>
    )
}

SimpleSelect.Container = Container
SimpleSelect.Select = Select
SimpleSelect.Icon = Icon
