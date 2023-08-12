import { ChooseProvider } from '@/app/tenant/[host]/token/[token]/ChooseProvider'
import { ProviderSetupProvider } from '@/components/context'
import { ProviderSetupParams, providerSetupContext } from '@/lib/hooks'
import { getPayloadForToken, getTenantDataFromHost } from '@/lib/ssr'
import { jwtVerify } from 'jose'

export default async function Layout({ params: { token, host }, children }) {
    const { secret } = await getTenantDataFromHost({ host })
    const payload = await getPayloadForToken({ token, host, secret })
    console.log(payload)
    return (
        <ProviderSetupProvider value={payload}>
            {children}
        </ProviderSetupProvider>
    )
}
