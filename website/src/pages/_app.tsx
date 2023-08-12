import { NextUIProvider } from '@nextui-org/react'
import 'website/src/styles/index.css'

import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import {
    SessionContextProvider,
    useSession,
} from '@supabase/auth-helpers-react'

import NextNprogress from 'nextjs-progressbar'

import { useRouter } from 'next/router'
import Script from 'next/script'
import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
    const router = useRouter()
    const isDashboard = router.asPath.startsWith('/org')
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
                <Component {...pageProps} />
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
    )
}
