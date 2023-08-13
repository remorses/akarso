import { Button, Input } from '@nextui-org/react'
import NProgress from 'nprogress'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { useThrowingFn } from 'beskar/landing'
import router from 'next/router'
import { useEffect, useState } from 'react'
import { MyNavbar } from 'website/src/components/specific'
import { createLoginRedirectUrl } from 'website/src/lib/utils'

const Login = () => {
    const user = useUser()

    const supabase = useSupabaseClient()

    // if (session) {
    //   return <pre className="">{JSON.stringify(session, null, 2)}</pre>
    // }
    useEffect(() => {
        if (user) {
            router.replace('/dashboard')
        } else {
        }
    }, [user])
    const { fn: loginWithGoogle, isLoading } = useThrowingFn({
        async fn() {
            NProgress.start()
            const { data } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        prompt: 'select_account',
                    },
                    redirectTo,
                },
            })
        },
    })
    const { fn: sso, isLoading: ssoLoading } = useThrowingFn({
        async fn() {
            NProgress.start()

            const { data, error } = await supabase.auth.signInWithSSO({
                domain: email.split('@')[1],
                options: {
                    redirectTo,
                },
            })
            if (error) console.error(error)
            await router.push(data?.url!)
        },
    })

    const redirectTo = createLoginRedirectUrl({ signupReason: 'login' })
    const [email, setEmail] = useState('')
    return (
        <div className='w-full gap-24 flex flex-col max-w-[1200px] mx-auto'>
            <MyNavbar />
            <div className='flex self-center bg-white p-12 min-w-[400px] rounded-lg shadow flex-col gap-8'>
                <Button
                    onClick={async () => {
                        loginWithGoogle()
                    }}
                    isLoading={isLoading}
                    color='primary'
                >
                    Login With Google
                </Button>
                <hr className='w-full' />
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        sso()
                    }}
                    className='flex flex-col gap-4 '
                >
                    <div className='text-sm self-center'>Or Login With SSO</div>
                    <Input
                        onValueChange={setEmail}
                        value={email}
                        placeholder='tommy@example.com'
                        type='email'
                    />
                    <Button
                        type='submit'
                        isLoading={ssoLoading}
                        isDisabled={!email || !email.includes('@')}
                    >
                        Login With SSO
                    </Button>
                </form>
            </div>
        </div>
    )
}

export default Login
