'use client'
import { Toaster } from 'react-hot-toast'
import { NextUIProvider } from '@nextui-org/react'
import { providerSetupContext } from '@/lib/hooks'

export function Providers({ children }) {
    return (
        <NextUIProvider>
            <Toaster />
            {children}
        </NextUIProvider>
    )
}

export function ProviderSetupProvider({
    children,
    value,
}: {
    value
    children: React.ReactNode
}) {
    return (
        <providerSetupContext.Provider value={value}>
            {children}
        </providerSetupContext.Provider>
    )
}
