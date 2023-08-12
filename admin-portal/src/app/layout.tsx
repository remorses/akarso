import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextUIProvider } from '@nextui-org/react'
import { Providers } from 'admin-portal/src/components/context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'SSO Admin Portal',
    description: 'Manage your SSO connection',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang='en'>
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}
