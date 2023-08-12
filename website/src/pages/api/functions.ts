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
    
    const { req, res } = await getNodejsContext()
    
}
