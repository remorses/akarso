'use client'

import { SiteData } from 'admin-portal/src/lib/ssr'
import React, { useRef, useState } from 'react'
import { createContext, useContext, useEffect } from 'react'
import toast from 'react-hot-toast'

export type ProviderSetupParams = {
    callbackUrl: string
    metadata: Record<string, string>
    domain: string
}

export const providerSetupContext = createContext<
    (ProviderSetupParams & Pick<SiteData, 'color' | 'logoUrl'>) | null
>(null)

export function useSetupParams() {
    return useContext(providerSetupContext)!
}

export function useThrowingFn({
    fn: fnToWrap,
    successMessage = '',
    immediate = false,
}) {
    const [isLoading, setIsLoading] = React.useState(false)
    useEffect(() => {
        if (immediate) {
            fn()
        }
    }, [immediate])
    const fn = async function wrappedThrowingFn(...args) {
        try {
            setIsLoading(true)
            const result = await fnToWrap(...args)
            if (result?.skipToast) {
                return result
            }
            if (successMessage) {
                toast.success(successMessage)
            }

            return result
        } catch (err) {
            console.error(err)
            // how to handle unreadable errors? simply don't return them from APIs, just return something went wrong
            if (err instanceof Error && !err?.['skipToast']) {
                toast.error(err.message, {})
                return err
            }
            return err
        } finally {
            setIsLoading(false)
        }
    }

    return {
        isLoading,
        fn,
    }
}
type PagePropsMessage = {
    newPageProps: Record<string, any>
}
function previewPropsEnabled() {
    return window.name === 'previewProps'
}

export function usePreviewProps<T extends Record<string, any>>(
    initialPageProps: T,
): T {
    let [changes, setChanges] = useState<Partial<T>>(null as any)
    const latestPageProps = useRef<T>(initialPageProps)
    // TODO react people tell that it is not safe to update ref in render, who cares
    latestPageProps.current = { ...initialPageProps, ...changes }

    useEffect(() => {
        if (!previewPropsEnabled()) {
            return
        }
        console.log(`Preview props enabled`)
        function listener(ev: MessageEvent<PagePropsMessage>) {
            // NProgress.start()
            try {
                console.log('got postMessage', ev)
                if (typeof ev.data !== 'object') return
                if (ev.data.newPageProps) {
                    setChanges((changes) => {
                        let newChanges = {
                            ...changes,
                            ...ev.data.newPageProps,
                        }
                        console.log('updating page props', newChanges)
                        latestPageProps.current = {
                            ...latestPageProps.current,
                            ...newChanges,
                        }
                        return newChanges
                    })

                    // setPageProps({ ...pageProps, newChanges })
                }
            } finally {
                // NProgress.done()
            }
        }
        window.addEventListener('message', listener)
        return () => {
            window.removeEventListener('message', listener)
        }
    }, [])

    return latestPageProps.current
}
