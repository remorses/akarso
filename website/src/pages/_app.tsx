'skip ssr'

import 'prismjs/themes/prism-tomorrow.css'
import 'website/src/styles/index.css'

import {
    SessionContextProvider,
    useSession,
} from '@supabase/auth-helpers-react'
import { useEffect, useState } from 'react'

import { Analytics } from '@vercel/analytics/react'
import { DashboardContainer } from 'website/src/components/DashboardContainer'
import { Lexend } from 'next/font/google'
import NextNprogress from 'nextjs-progressbar'
import { NextUIProvider } from '@nextui-org/react'
import Script from 'next/script'
import { Toaster } from 'react-hot-toast'
import classNames from 'classnames'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { dashboardContext } from 'website/src/lib/hooks'
import { useRouter } from 'next/router'

const font = Lexend({ subsets: ['latin'] })

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
    const router = useRouter()
    const isDashboard = router.asPath.startsWith('/org/')
    const is404 = pageProps?.['statusCode'] > 200
    if (Component.disableNprogress) {
        pageProps.disableNprogress = true
    }
    if (is404) {
        return (
            <CommonProviders pageProps={pageProps}>
                <Component {...pageProps} />
            </CommonProviders>
        )
    }
    if (isDashboard) {
        return (
            <CommonProviders pageProps={pageProps}>
                <dashboardContext.Provider value={pageProps as any}>
                    <DashboardContainer>
                        <Component key={router.asPath} {...pageProps} />
                    </DashboardContainer>
                </dashboardContext.Provider>
            </CommonProviders>
        )
    }

    return (
        <CommonProviders pageProps={pageProps}>
            <Component {...pageProps} />
        </CommonProviders>
    )
}
export default MyApp

function CommonProviders({ children, pageProps }) {
    const [supabase] = useState(() => createPagesBrowserClient({}))
    return (
        <div className={classNames(font.className, 'w-full h-full')}>
            <Analytics />

            <SessionContextProvider
                supabaseClient={supabase}
                initialSession={pageProps.initialSession}
            >
                <NextUIProvider>
                    <Script async src='https://cdn.splitbee.io/sb.js'></Script>
                    {!pageProps.disableNprogress && (
                        <NextNprogress
                            color='#f59e0b'
                            startPosition={0.3}
                            stopDelayMs={200}
                            height={4}
                            options={{ showSpinner: false }}
                            showOnShallow={true}
                        />
                    )}
                    <Toaster
                        containerStyle={{ zIndex: 10000 }}
                        position='top-center'
                    />

                    {children}
                </NextUIProvider>
            </SessionContextProvider>
        </div>
    )
}
