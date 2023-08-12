"poor man's use server"
import { getPayloadForToken, wrapMethod } from '@/lib/ssr'
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
    // token is used as authentication, if user has this token it means he can setup sso for this domain, this means generated urls should expire and should not be shared in public, otherwise anyone could override an SSO connection
    const { payload, secret } = await getPayloadForToken({ token, host })
    const { callbackUrl, domain, metadata } = payload
    const url = new URL(callbackUrl)
    const accessToken = ''
    const projectRef = ''
    const client = new SupabaseManagementAPI({ accessToken })
    const ssoProv = await client.createSSOProvider(projectRef, {
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
