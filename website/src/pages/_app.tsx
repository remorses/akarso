import { NextUIProvider } from '@nextui-org/react'
import 'prismjs/themes/prism-tomorrow.css'
import 'website/src/styles/index.css'
import { Lexend } from 'next/font/google'

import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import {
    SessionContextProvider,
    useSession,
} from '@supabase/auth-helpers-react'

const font = Lexend({ subsets: ['latin'] })

import NextNprogress from 'nextjs-progressbar'

import { useRouter } from 'next/router'
import Script from 'next/script'
import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import classNames from 'classnames'
import { DashboardContainer } from 'website/src/components/DashboardContainer'
import { dashboardContext } from 'website/src/lib/hooks'

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
            <dashboardContext.Provider
                key={router.asPath}
                value={pageProps as any}
            >
                <DashboardContainer>
                    <CommonProviders pageProps={pageProps}>
                        <Component {...pageProps} />
                    </CommonProviders>
                </DashboardContainer>
            </dashboardContext.Provider>
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
