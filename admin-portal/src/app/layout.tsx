import './globals.css'
import type { Metadata } from 'next'
import { Lexend } from 'next/font/google'
import { NextUIProvider } from '@nextui-org/react'
import { Providers } from 'admin-portal/src/components/context'

const font = Lexend({ subsets: ['latin'], weight: ['400', '500', '600'] })

export const runtime = 'edge'

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
        <html lang='en' className={font.className}>
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}
