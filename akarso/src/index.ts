import { fetch } from 'native-fetch'
import { SignJWT, jwtVerify } from 'jose'

export async function getSSOCallbackResult({ token, secret }) {
    const { payload } = await jwtVerify(
        decodeURIComponent(token),
        new TextEncoder().encode(secret),
    )
    const data = payload as CallbackParams
    if (!data.metadata) {
        data.metadata = {}
    }
    return data
}

export async function updateOrCreateSSOConnection({
    metadata,
    identifier,
    callbackUrl,
    secret,
}: SetupParams & { secret: string }) {
    const payload = {
        metadata,
        identifier,
        callbackUrl,
    }
    const res = await fetch(`https://akarso.co/api/session`, {
        method: 'POST',
        body: JSON.stringify({ secret }),
    })
    if (!res.ok) {
        throw new Error(
            `failed to get host for Admin portal: ${
                res.status
            } ${await res.text()}`,
        )
    }
    const { host, hash } = await res.json()

    const url = `https://${host}/session/${hash}`
    return { url }
}

export type SetupParams = {
    callbackUrl: string
    identifier: string
    metadata?: Record<string, string>
    domain: string
}

export type CallbackParams = {
    ssoProviderId: string
    identifier: string
    metadata: Record<string, any>
    domain: string
}
