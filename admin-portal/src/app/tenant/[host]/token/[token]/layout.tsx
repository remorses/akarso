import { ChooseProvider } from '@/app/tenant/[host]/token/[token]/ChooseProvider'
import { cookies } from 'next/headers'
import { ProviderSetupProvider } from '@/components/context'
import { ProviderSetupParams, providerSetupContext } from '@/lib/hooks'
import { getPayloadForToken, getTenantDataFromHost } from '@/lib/ssr'
import { jwtVerify } from 'jose'
import { notFound } from 'next/navigation'

export default async function Layout({ params: { token, host }, children }) {
    const { secret, notFound: fourOFour } = await getTenantDataFromHost({
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
    console.log(payload)
    return (
        <ProviderSetupProvider value={payload}>
            {children}
        </ProviderSetupProvider>
    )
}
