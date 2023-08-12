import { fetch } from 'native-fetch'
import { SignJWT, jwtVerify } from 'jose'

export async function getCallback({ token, secret }) {
    const { payload } = await jwtVerify(
        decodeURIComponent(token),
        new TextEncoder().encode(secret),
    )
    const data = payload as CallbackParams
    return data
}

export async function updateOrCreateSSOConnection({
    metadata,
    identifier,
    domain,
    callbackUrl,
    secret,
}: SetupParams & { secret: string }) {
    const payload = {
        metadata,
        identifier,
        domain,
        callbackUrl,
    }
    const res = await fetch(`https://akarso.co/api/get-host`, {
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
    const { host } = await res.json()
    const token = encodeURIComponent(
        await new SignJWT(payload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('2h')
            .sign(new TextEncoder().encode(secret)),
    )

    const url = `https://${host}/token/${token}`
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
    metadata?: Record<string, string>
    domain: string
}
