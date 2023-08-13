import { Button } from '@nextui-org/react'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { Footer } from 'beskar/landing'
import Link from 'next/link'
import { useRouter } from 'next/router'

export function MyNavbar({}) {
    const session = useSession()
    const supabase = useSupabaseClient()
    let canLogout = !!session
    return (
        <div className='flex gap-12 py-5 items-center '>
            <Link href='/' className='font-bold text-2xl'>
                akarso.
            </Link>
            <div className='grow'></div>
            <Link href={'/blog'}>Blog</Link>
            <Link href={'https://twitter.com/__morse'}>Who made this?</Link>
            {canLogout ? (
                <Link
                    href=''
                    onClick={async (e) => {
                        e.preventDefault()
                        const { error } = await supabase.auth.signOut()
                        window.location.href = '/'

                        // signOut({ callbackUrl: '/', redirect: true })
                    }}
                >
                    Sign Out
                </Link>
            ) : (
                <LoginLink />
            )}
        </div>
    )
}
export function LoginLink({}) {
    const session = useSession()
    const router = useRouter()

    if (session) {
        return null
    }
    return (
        <div className='max-w-[14ch] text-left md:text-center'>
            <Link data-name='login' href='/login'>
                Login or Sign Up
            </Link>
        </div>
    )
}

export function MyFooter({}) {
    const supabase = useSupabaseClient()
    return (
        <Footer
            justifyAround
            columns={{
                links: (
                    <>
                        <div className=''>
                            <button
                                className='border-0'
                                onClick={() => {
                                    supabase.auth.signOut()
                                    window.location.href = '/'
                                }}
                            >
                                Sign Out
                            </button>
                        </div>
                    </>
                ),
                'Other projects': (
                    <>
                        <Link href='https://notaku.so'>Notaku</Link>
                    </>
                ),
                // 'Other languages': (
                //     <>
                //         <Link href='https://notaku.so'>Notaku</Link>
                //     </>
                // ),
                'Who made this?': (
                    <>
                        <Link href='https://twitter.com/__morse'>
                            My Twitter
                        </Link>
                        {/* <Link href='mailto:tommy@salespack.io'>Contact me</Link> */}
                    </>
                ),
            }}
        />
    )
}
