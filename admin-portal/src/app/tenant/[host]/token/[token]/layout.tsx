import { ChooseProvider } from '@/components/ChooseProvider'
import { cookies } from 'next/headers'
import { ProviderSetupProvider } from 'admin-portal/src/components/context'
import { TokenData, providerSetupContext } from 'admin-portal/src/lib/hooks'
import {
    getPayloadForToken,
    getSiteDataFromHost,
} from 'admin-portal/src/lib/ssr'
import { jwtVerify } from 'jose'
import { notFound, redirect } from 'next/navigation'
import { SessionExpired } from '@/components/SessionExpired'

export const revalidate = 0

export default async function Layout({ params: { token, host }, children }) {
    const {
        secret,
        notFound: fourOFour,
        supabaseAccessToken,
        supabaseProjectRef,
        ...publicSiteData
    } = await getSiteDataFromHost({
        host,
    })
    if (fourOFour) {
        return notFound()
    }

    // console.log({ token })

    const { payload, expired } = await getPayloadForToken({
        token,
        secret,
        cookies,
    })
    const context = { ...payload, ...publicSiteData, token }
    if (expired) {
        return (
            <ProviderSetupProvider value={context}>
                <SessionExpired />
            </ProviderSetupProvider>
        )
    }
    if (!payload) {
        return notFound()
    }

    return (
        <ProviderSetupProvider value={context}>
            {children}
        </ProviderSetupProvider>
    )
}
