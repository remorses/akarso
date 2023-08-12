import { ChooseProvider } from 'admin-portal/src/app/tenant/[host]/token/[token]/ChooseProvider'
import { cookies } from 'next/headers'
import { ProviderSetupProvider } from 'admin-portal/src/components/context'
import { ProviderSetupParams, providerSetupContext } from 'admin-portal/src/lib/hooks'
import { getPayloadForToken, getSiteDataFromHost } from 'admin-portal/src/lib/ssr'
import { jwtVerify } from 'jose'
import { notFound } from 'next/navigation'

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
    if (!payload) {
        return notFound()
    }

    return (
        <ProviderSetupProvider value={{ ...payload, color, logoUrl }}>
            {children}
        </ProviderSetupProvider>
    )
}
