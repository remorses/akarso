import { ProviderSetupParams } from '@/lib/hooks'
import { jwtVerify } from 'jose'

export function wrapMethod(fn) {
    return async (...args) => {
        try {
            const res = await fn(...args)
            return res
        } catch (error) {
            console.error(error)
            throw error
        }
    }
}

export async function getTenantDataFromHost({ host }) {
    return { secret: 'secret', supabaseAccessToken: '', supabaseProjectRef: '' }
}

export async function getPayloadForToken({ token, secret, host }) {
    const verified = await jwtVerify(
        decodeURIComponent(token),
        new TextEncoder().encode(secret),
    )
    const payload: ProviderSetupParams = verified.payload as any
    return { payload, secret }
}
