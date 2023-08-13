import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import router from 'next/router'
import { useEffect } from 'react'
import { MyNavbar } from 'website/src/components/specific'
import { createLoginRedirectUrl } from 'website/src/lib/utils'

const Login = () => {
    const user = useUser()

    const supabase = useSupabaseClient()

    // if (session) {
    //   return <pre className="">{JSON.stringify(session, null, 2)}</pre>
    // }

    const redirectTo = createLoginRedirectUrl({ signupReason: 'login' })
    useEffect(() => {
        if (user) {
            router.replace('/editor')
        } else {
            supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        prompt: 'select_account',
                    },
                    redirectTo,
                },
            })
        }
    }, [user])

    return (
        <div className='w-full flex flex-col max-w-[1200px] mx-auto'>
            <MyNavbar />
        </div>
    )
}

export default Login
