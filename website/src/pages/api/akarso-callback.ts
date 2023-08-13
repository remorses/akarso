import { getAkarsoCallbackResult } from 'akarso'
import { env } from 'db/env'
import { createSupabaseAdmin } from 'db/supabase'

import { NextRequest, NextResponse } from 'next/server'
import { KnownError } from 'website/src/lib/errors'
import { notifyError } from 'website/src/lib/sentry'

export const config = {
    runtime: 'edge',
}

const handler = async (req: NextRequest) => {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) {
        return NextResponse.json('token missing from query', {
            status: 400,
        })
    }
    try {
        const callbackData =
            await getAkarsoCallbackResult({
                secret: env.AKARSO_SECRET,
                token,
            })
        console.log('callbackData', callbackData)
        const { identifier, domain, ssoProviderId, metadata } = callbackData
        console.log(
            `received akarso callback for ${identifier}: registered ${domain} with provider id ${ssoProviderId}`,
        )
        const { slug } = metadata || {}
        if (!slug) {
            throw new KnownError(`slug is missing`)
        }
        const supabase = createSupabaseAdmin()
        const { data: org } = await supabase
            .from('org')
            .select()
            .eq('orgId', identifier)
            .single()
        if (!org) {
            throw new KnownError(`org ${identifier} not found`)
        }

        const { error } = await supabase
            .from('org')
            .update({ ssoProviderId })
            .eq('orgId', identifier)

        // Check for errors and retrieve the result
        if (error) {
            console.error('Error updating org:', error)
        } else {
            console.log('Org updated successfully')
        }

        return NextResponse.redirect(
            `${env.NEXT_PUBLIC_URL}/org/${org.orgId}/site/${slug}`,
        )
    } catch (error: any) {
        notifyError(error, 'get-session API')
        return NextResponse.json(error.message, {
            status: 500,
        })
    }
}

export default handler
