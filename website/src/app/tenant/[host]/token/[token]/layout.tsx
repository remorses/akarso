import { ChooseProvider } from '@/app/tenant/[host]/token/[token]/ChooseProvider'
import { ProviderSetupProvider } from '@/components/context'
import { ProviderSetupParams, providerSetupContext } from '@/lib/hooks'
import { jwtVerify } from 'jose'

async function getJwtSecretKey({ host }) {
    return 'secret'
}

export default async function Layout({ params: { token, host }, children }) {
    const secret = await getJwtSecretKey({ host })
    const verified = await jwtVerify(
        decodeURIComponent(token),
        new TextEncoder().encode(secret),
    )
    const payload: ProviderSetupParams = verified.payload as any
    console.log(payload)
    return (
        <ProviderSetupProvider value={payload}>
            {children}
        </ProviderSetupProvider>
    )
}
