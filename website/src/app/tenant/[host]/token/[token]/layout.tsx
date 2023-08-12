import { ChooseProvider } from '@/app/tenant/[host]/token/[token]/ChooseProvider'
import { ProviderSetupProvider } from '@/components/context'
import { ProviderSetupParams, providerSetupContext } from '@/lib/hooks'
import { getPayloadForToken } from '@/lib/ssr'
import { jwtVerify } from 'jose'

async function getJwtSecretKey({ host }) {
    return 'secret'
}

export default async function Layout({ params: { token, host }, children }) {
    const payload = await getPayloadForToken({ token, host })
    console.log(payload)
    return (
        <ProviderSetupProvider value={payload}>
            {children}
        </ProviderSetupProvider>
    )
}
