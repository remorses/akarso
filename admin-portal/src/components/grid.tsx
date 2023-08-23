import { colors } from '@nextui-org/theme'
import React from 'react'

export function BGGrid({ children }: { children?: React.ReactNode }) {
    return (
        <div
            style={{}}
            className='[--background:0_0%_100%] [--muted:210_40%_96.1%] dark:[--background:224_71%_4%] dark:[--muted:223_47%_11%] min-h-screen w-full relative'
        >
            <div
                className='fixed inset-0 z-[-1] bg-transparent h-screen w-screen' // bg-gradient-to-b from-muted to-background
            >
                <div
                    className='w-full h-full'
                    style={{
                        backgroundSize: '50px 50px',
                        backgroundImage:
                            'linear-gradient(0deg, transparent 24%, hsl(var(--muted)/80%) 25%, hsl(var(--muted)/80%) 26%, transparent 27%, transparent 74%, hsl(var(--muted)/80%) 75%, hsl(var(--muted)/80%) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, hsl(var(--muted)/80%) 25%, hsl(var(--muted)/80%) 26%, transparent 27%, transparent 74%, hsl(var(--muted)/80%) 75%, hsl(var(--muted)/80%) 76%, transparent 77%, transparent)',
                    }}
                />
                <div className='w-full absolute inset-0 h-full bg-gradient-to-t from-sky-50/70 to-white/10 '></div>
            </div>
            {children}
        </div>
    )
}
