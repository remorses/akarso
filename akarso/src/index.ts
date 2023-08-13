import { fetch } from 'native-fetch'
import { SignJWT, jwtVerify } from 'jose'

export async function getAkarsoCallbackResult({ token, secret }) {
    const { payload } = await jwtVerify(
        decodeURIComponent(token),
        new TextEncoder().encode(secret),
    )
    const data = payload as AkarsoCallbackParams
    if (!data.metadata) {
        data.metadata = {}
    }
    return data
}

export async function createAkarsoAdminPortalSession({
    metadata,
    identifier,
    callbackUrl,
    secret,
}: AkarsoSessionParams) {
    const res = await fetch(`https://akarso.co/api/portal-session`, {
        method: 'POST',
        body: JSON.stringify({ secret, metadata, identifier, callbackUrl }),
    })
    if (!res.ok) {
        throw new Error(
            `failed to get host for Admin portal: ${
                res.status
            } ${await res.text()}`,
        )
    }
    const { host, url, hash } = await res.json()

    return { url }
}

export type AkarsoSessionParams = {
    callbackUrl: string
    identifier: string
    metadata?: Record<string, string>
    secret: string
}

export type AkarsoCallbackParams = {
    ssoProviderId: string
    identifier: string
    metadata: Record<string, any>
    domain: string
}
