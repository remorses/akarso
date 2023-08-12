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

export function getJwtSecretKey({ host }) {
    return 'secret'
}

export async function getPayloadForToken({ token, host }) {
    const secret = await getJwtSecretKey({ host })
    const verified = await jwtVerify(
        decodeURIComponent(token),
        new TextEncoder().encode(secret),
    )
    const payload: ProviderSetupParams = verified.payload as any
    return { payload, secret }
}
