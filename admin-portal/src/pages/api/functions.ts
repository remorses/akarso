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
    hash,
    domain,
    metadataXml = undefined as string | undefined,
    metadataUrl = undefined as string | undefined,
    attributeMappings = {},
}) {
    if (!metadataXml && !metadataUrl) {
        throw new Error(`must provide either metadataXml or metadataUrl`)
    }
    if (!hash) {
        throw new Error(`must provide hash`)
    }
    if (!domain) {
        throw new Error(`must provide domain`)
    }
    if (!metadataXml) {
        metadataXml = undefined
    }
    if (!metadataUrl) {
        metadataUrl = undefined
    }
    const { req, res } = await getNodejsContext()
    const host = req?.headers.host
    const sess = await getSiteDataFromHost({ host })
    if (sess.notFound) {
        throw new Error(`tenant not found`)
    }
    const { secret, notFound, supabaseAccessToken, supabaseProjectRef } = sess
    // hash is used as authentication, if user has this hash it means he can setup sso for this domain, this means generated urls should expire and should not be shared in public, otherwise anyone could override an SSO connection
    const { payload, expired } = await getPayloadForToken({
        hash,
        secret,
    })
    if (expired) {
        throw new Error(`Admin portal session expired, create a new one`)
    }
    if (!payload) {
        throw new Error(`missing payload`)
    }
    const { callbackUrl, identifier, metadata } = payload
    // TODO check if this domain is already used by another tenant, if yes and has different identifier, throw error
    // TODO think about dynamic code evaluation, tenants could find ways to talk with my database if they manage to run code here
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
