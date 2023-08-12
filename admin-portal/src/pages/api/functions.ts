"poor man's use server"
import {
    getPayloadForToken,
    getTenantDataFromHost,
    wrapMethod,
} from '@/lib/ssr'
import { SignJWT } from 'jose'
import { getNodejsContext } from 'server-actions-for-next-pages/context'
import { SupabaseManagementAPI } from 'supabase-management-js'

export { wrapMethod }

export async function createSSOProvider({
    token,
    metadataXml = undefined as string | undefined,
    metadataUrl = undefined as string | undefined,
    attributeMappings = {},
}) {
    if (!metadataXml && !metadataUrl) {
        throw new Error(`must provide either metadataXml or metadataUrl`)
    }
    if (!metadataXml) {
        metadataXml = undefined
    }
    if (!metadataUrl) {
        metadataUrl = undefined
    }
    const { req, res } = await getNodejsContext()
    const host = req?.headers.host
    const { secret, supabaseAccessToken, supabaseProjectRef } =
        await getTenantDataFromHost({ host })
    // token is used as authentication, if user has this token it means he can setup sso for this domain, this means generated urls should expire and should not be shared in public, otherwise anyone could override an SSO connection
    const { payload } = await getPayloadForToken({
        token,
        host,
        secret,
    })
    const { callbackUrl, domain, metadata } = payload
    const url = new URL(callbackUrl)

    const client = new SupabaseManagementAPI({
        accessToken: supabaseAccessToken,
    })
    const ssoProv = await client.createSSOProvider(supabaseProjectRef, {
        type: 'saml',
        domains: [domain],
        metadata_xml: metadataXml,
        metadata_url: metadataUrl,
        // attribute_mapping: attributeMappings,
    })
    if (!ssoProv) {
        throw new Error(`failed to create sso provider`)
    }
    const ssoProviderId = ssoProv.id

    const callbackPayload = { metadata, domain, ssoProviderId }
    const encoded = await new SignJWT(callbackPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('2h')
        .sign(new TextEncoder().encode(secret))
    url.searchParams.set('data', encodeURIComponent(encoded))
    return {
        url: url.toString(),
    }
}