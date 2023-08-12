"poor man's use server"
import { NextRequest } from 'next/server'
import {
    getPayloadForToken,
    getSiteDataFromHost,
    wrapMethod,
} from 'admin-portal/src/lib/ssr'
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
    const { secret, notFound, supabaseAccessToken, supabaseProjectRef } =
        await getSiteDataFromHost({ host })
    if (notFound) {
        throw new Error(`tenant not found`)
    }
    // token is used as authentication, if user has this token it means he can setup sso for this domain, this means generated urls should expire and should not be shared in public, otherwise anyone could override an SSO connection
    const { payload } = await getPayloadForToken({
        token,
        secret,
        cookies() {
            return new Map(Object.entries((req as any as NextRequest).cookies))
        },
    })
    if (!payload) {
        throw new Error(`missing payload`)
    }
    const { callbackUrl, domain, metadata } = payload
    const url = new URL(callbackUrl)

    if (!supabaseAccessToken) {
        throw new Error(`missing supabaseAccessToken`)
    }
    if (!supabaseProjectRef) {
        throw new Error(`missing supabaseProjectRef`)
    }
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
