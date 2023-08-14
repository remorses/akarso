import { Button, cn } from '@nextui-org/react'
import { useState } from 'react'
import { motion } from 'framer-motion'

export function ShowMore({
    children,
    buttonText = 'Show More',
    height = 300,
    className = '',
}) {
    const [showMore, setShowMore] = useState(false)
    return (
        <motion.div
            initial={{
                height: 0,
                // opacity: 0,
            }}
            animate={{
                height: showMore ? 'auto' : height,
                opacity: 1,
                transition: {
                    type: 'tween',
                    duration: 0.15,
                    ease: 'easeInOut',
                },
            }}
            className={cn(
                'flex relative flex-col overflow-hidden', //
                // showMore ? 'h-full' : 'h-32',
                className,
            )}
        >
            {children}
            {!showMore && (
                <div className='absolute bg-gradient-to-b from-transparent to-gray-100 to-90% inset-0 '></div>
            )}
            {!showMore && (
                <div className='absolute bottom-1 gap-6 w-full flex items-center justify-around'>
                    <hr className='grow' />
                    <Button
                        // variant='ghost'
                        // variant='ghost'
                        className='border-0 font-semibold'
                        size='sm'
                        onClick={() => setShowMore(true)}
                    >
                        {buttonText}
                    </Button>
                    <hr className='grow' />
                </div>
            )}
        </motion.div>
    )
}
