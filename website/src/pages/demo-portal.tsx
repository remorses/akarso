import { DEMO_SITE_SECRET, env } from 'db/env'
import { prisma } from 'db/prisma'
import { GetServerSidePropsContext, GetServerSideProps } from 'next'
import { requireAuth } from 'website/src/lib/ssr'
import { createSessionUrl } from 'website/src/lib/ssr-edge'

export default function Page() {
    return null
}

export const getServerSideProps = (async (ctx: GetServerSidePropsContext) => {
    const secret = DEMO_SITE_SECRET
    const slug = 'demo'
    const site = await prisma.site.upsert({
        where: {
            // secret,
            slug,
        },
        create: {
            secret,
            slug,
            orgId: env.DEMO_ORG_ID!,
            logoUrl:
                'https://edlzdykcnsqevfjzscic.supabase.co/storage/v1/object/public/user-uploads/e8a59d6c-2e43-4083-b3f1-59b83612292c/3ff3c770-81f5-4c0b-ac68-662d75e0e263-logo_with_text_black%402x-png',
            supabaseAccessToken: 'https://xxx',
            supabaseProjectRef: 'xxx',
            acsUrl: 'https://xxx',
            entityId: 'https://xxx',
            relayState: 'https://xxx',
            startUrl: 'https://xxx',
            websiteUrl: 'https://akarso.co',
        },
        update: {
            slug,
            secret,
        },
    })
    const { url } = await createSessionUrl({
        callbackUrl: env.NEXT_PUBLIC_URL,
        identifier: 'x',
        secret,
    })
    return {
        redirect: {
            destination: url,
            permanent: false,
        },
    }
}) satisfies GetServerSideProps
