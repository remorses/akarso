'use client'
import { ChooseProvider } from 'admin-portal/src/app/tenant/[host]/token/[token]/ChooseProvider'
import { ProviderSetupParams, providerSetupContext } from 'admin-portal/src/lib/hooks'
import { jwtVerify } from 'jose'

export default function Page({ params: { token, host } }) {
    return <ChooseProvider />
}
