"poor man's use server"
import { v4 } from 'uuid'
import { AkarsoCallbackParams } from 'akarso/src'
import { NextRequest } from 'next/server'
import {
    getPortalSession,
    getSiteDataFromHost,
    refreshSupabaseToken,
    wrapMethod,
} from 'admin-portal/src/lib/ssr'
import { SignJWT } from 'jose'
import { getEdgeContext } from 'server-actions-for-next-pages/context'
import { SupabaseManagementAPI } from 'supabase-management-js'
import { DEMO_SITE_SECRET } from 'db/env'
import { createSupabaseAdmin } from 'db/supabase'
import { retry } from '@/lib/utils'

export { wrapMethod }

export const config = { runtime: 'edge' }

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
    const { req, res } = await getEdgeContext()
    const host = req?.headers.get('host')
    const site = await getSiteDataFromHost({ host })
    if (site.notFound) {
        throw new Error(`tenant not found`)
    }
    const {
        secret,
        supabaseRefreshToken: oldRefreshToken,
        supabaseProjectRef,
    } = site
    if (secret == DEMO_SITE_SECRET) {
        console.warn(`DEMO_SITE_SECRET, returning`)
        return {
            url: 'https://akarso.co',
        }
    }
    // hash is used as authentication, if user has this hash it means he can setup sso for this domain, this means generated urls should expire and should not be shared in public, otherwise anyone could override an SSO connection
    const { payload, expired, notFound } = await getPortalSession({
        hash,
        secret,
        host,
    })
    if (expired) {
        throw new Error(`Admin Portal session expired, create a new one`)
    }
    if (notFound) {
        throw new Error(`Admin Portal session not found, create a new one`)
    }
    if (!payload) {
        throw new Error(`missing payload`)
    }
    const { callbackUrl, identifier, metadata, orgId } = payload

    if (!identifier) {
        throw new Error(
            `missing customer identifier, this is expected in a demo SSO portal`,
        )
    }
    // TODO check if this domain is already used by another tenant, if yes and has different identifier, throw error
    // TODO think about dynamic code evaluation, tenants could find ways to talk with my database if they manage to run code here
    const url = new URL(callbackUrl)

    if (!oldRefreshToken) {
        throw new Error(`missing supabaseRefreshToken`)
    }
    const { supabaseAccessToken, supabaseRefreshToken } =
        await refreshSupabaseToken({
            supabaseRefreshToken: oldRefreshToken,
        })
    // console.log({ supabaseRefreshToken, oldRefreshToken })
    if (!supabaseProjectRef) {
        throw new Error(`missing supabaseProjectRef`)
    }
    const client = new SupabaseManagementAPI({
        accessToken: supabaseAccessToken,
    })
    const supabase = createSupabaseAdmin()

    const savingTokenPromise = retry(3, async () => {
        const { error } = await supabase
            .from('Site')
            .update({
                supabaseAccessToken,
                supabaseRefreshToken,
            })
            .eq('secret', secret)
        if (error) {
            throw new Error(
                `Failed to update site with supabase tokens: ${error}`,
            )
        }
    })()

    const ssoProviderId = await Promise.resolve()
        .then(async () => {
            try {
                const ssoProv = await client.createSSOProvider(
                    supabaseProjectRef,
                    {
                        type: 'saml',
                        domains: [domain],
                        metadata_xml: metadataXml,
                        metadata_url: metadataUrl,
                        // attribute_mapping: attributeMappings,
                    },
                )
                if (!ssoProv) {
                    throw new Error(`failed to create sso provider`)
                }
                const ssoProviderId = ssoProv.id
                return ssoProviderId
            } catch (error: any) {
                if (!error.message.includes('already exists')) {
                    throw error
                }

                const { data: connections, error: connError } = await supabase
                    .from('SSOConnection')
                    .select()
                    .eq('domain', domain)
                    .eq('orgId', orgId)
                    .eq('identifier', identifier)
                    .limit(1)
                if (connError) {
                    throw new Error(
                        `failed to get akarso sso connection: ${error.message}`,
                    )
                }
                const [connection] = connections || []
                if (!connection) {
                    throw new Error(
                        `sso provider already exists but it was not created with akaraso or it has a different identifier`,
                    )
                }
                console.log(`sso provider already exists, updating`)
                const providers = await client.getSSOProviders(
                    supabaseProjectRef,
                )
                // TODO find previous SSO provider using passed down ssoProviderId instead of domain?
                const prov = providers?.items.find(
                    (p) => p.domains?.find((x) => x.domain === domain),
                )
                if (!prov) {
                    throw new Error(`sso provider to update not found`)
                }
                const ssoProv = await client.updateSSOProvider(
                    supabaseProjectRef,
                    prov.id,
                    {
                        metadata_xml: metadataXml,
                        metadata_url: metadataUrl,
                        // attribute_mapping: attributeMappings,
                    },
                )
                return prov.id
            }
        })
        .catch(async (e) => {
            await savingTokenPromise
            throw e
        })

    await Promise.all([
        ssoProviderId &&
            supabase.from('SSOConnection').upsert({
                domain,
                id: v4(),
                identifier,
                orgId,
                ssoProviderId,
            }),
        savingTokenPromise,
    ])
    if (!ssoProviderId) {
        throw new Error(`failed to create sso provider`)
    }

    const callbackPayload: AkarsoCallbackParams = {
        metadata: (metadata as any) || {},
        identifier,
        domain,
        ssoProviderId,
    }
    const encoded = await new SignJWT(callbackPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('2h')
        .sign(new TextEncoder().encode(secret))
    url.searchParams.set('token', encodeURIComponent(encoded))
    return {
        url: url.toString(),
    }
}
