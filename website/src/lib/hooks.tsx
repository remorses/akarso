'use client'
import React from 'react'
import { createContext, useContext, useEffect } from 'react'
import toast from 'react-hot-toast'
import type { getServerSideProps } from 'website/src/pages/org/[orgId]/site/[slug]/setup'
import type { SiteData } from 'admin-portal/src/lib/ssr'

export type DashboardProps = Awaited<
    ReturnType<typeof getServerSideProps>
>['props']

export const dashboardContext = createContext<DashboardProps>(null as any)

export function useProps() {
    return useContext(dashboardContext)!
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
