import { createClient } from '@supabase/supabase-js'
import { Database } from './supabase.types'
import { env } from './env'

export function createSupabaseAdmin({ cacheTags = [] as string[] } = {}) {
    return createClient<Database>(
        env.NEXT_PUBLIC_SUPABASE_URL!,
        env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            global: {
                fetch(input, init) {
                    return fetch(input, {
                        ...init,
                        next: {
                            tags: ['supabase', ...cacheTags],
                        },
                    })
                },
            },
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            }, //
        },
    )
}
