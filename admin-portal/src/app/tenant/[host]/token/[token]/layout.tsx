import { ChooseProvider } from '@/components/ChooseProvider'
import { cookies } from 'next/headers'
import { ProviderSetupProvider } from 'admin-portal/src/components/context'
import {
    ProviderSetupParams,
    providerSetupContext,
} from 'admin-portal/src/lib/hooks'
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
        color,
        logoUrl,
    } = await getSiteDataFromHost({
        host,
    })
    if (fourOFour) {
        return notFound()
    }

    // console.log({ token })

    const payload = await getPayloadForToken({ token, secret, cookies })
    const context = { ...payload, token, color, logoUrl }
    if (payload.expired) {
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
