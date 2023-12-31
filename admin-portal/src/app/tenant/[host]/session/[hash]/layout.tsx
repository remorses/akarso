
import { ChooseProvider } from '@/components/ChooseProvider'
import { cookies } from 'next/headers'
import { ProviderSetupProvider } from 'admin-portal/src/components/context'
import { TokenData, providerSetupContext } from 'admin-portal/src/lib/hooks'
import {
    SiteData,
    getPortalSession,
    getSiteDataFromHost,
} from 'admin-portal/src/lib/ssr'
import { jwtVerify } from 'jose'
import { notFound, redirect } from 'next/navigation'
import { SessionExpired } from '@/components/SessionExpired'

export const revalidate = 60

export default async function Layout({
    params: { hash: hash, host },
    children,
}) {
    const data = await getSiteDataFromHost({
        host,
    })
    if (data.notFound) {
        return notFound()
    }
    const {
        acsUrl,
        color,
        createdAt,
        customDomain,
        entityId,
        logoUrl,
        orgId,
        relayState,
        siteId,
        slug,
        ssoMappings,
        startUrl,
        websiteUrl,
    } = data!
    const publicSiteData: Partial<SiteData> = {
        acsUrl,
        color,
        createdAt,
        customDomain,
        entityId,
        logoUrl,
        orgId,
        relayState,
        siteId,
        slug,
        ssoMappings,
        startUrl,
        websiteUrl,
    }

    // console.log({ hash })
    const {
        payload,
        expired,
        notFound: notF,
    } = await getPortalSession({
        hash,
        secret: data.secret,
        host,
    })

    const { secret: _, ...payloadPublicData } = payload!
    const context = { ...payloadPublicData, ...publicSiteData, hash }
    if (expired) {
        return (
            <ProviderSetupProvider value={context}>
                <SessionExpired />
            </ProviderSetupProvider>
        )
    }

    if (!payload || notF) {
        return notFound()
    }

    return (
        <ProviderSetupProvider value={context}>
            {children}
        </ProviderSetupProvider>
    )
}
