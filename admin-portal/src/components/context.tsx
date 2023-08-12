'use client'
import { Toaster } from 'react-hot-toast'
import { NextUIProvider } from '@nextui-org/react'
import { providerSetupContext, usePreviewProps } from 'admin-portal/src/lib/hooks'

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
    value = usePreviewProps(value)
    return (
        <providerSetupContext.Provider value={value}>
            {children}
        </providerSetupContext.Provider>
    )
}
