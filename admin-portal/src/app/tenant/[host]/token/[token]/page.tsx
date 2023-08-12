'use client'
import { ChooseProvider } from '@/app/tenant/[host]/token/[token]/ChooseProvider'
import { ProviderSetupParams, providerSetupContext } from '@/lib/hooks'
import { jwtVerify } from 'jose'

export default function Page({ params: { token, host } }) {
    return <ChooseProvider />
}
