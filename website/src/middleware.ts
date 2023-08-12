import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import type { NextFetchEvent } from 'next/server'
import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { HTMLRewriter } from 'htmlrewriter'
import { env } from 'website/../db/env'



function rewriterForFramerSite(siteUrl, canonicalPath) {
    return function (req: NextRequest) {
        return new HTMLRewriter()
            .on('a', {
                element(element) {
                    const past = safeUrl(element.getAttribute('href'))

                    if (!past) {
                        return
                    }

                    if (
                        ![
                            'preview.holocron.so',
                            'preview.akarso.co',
                            new URL(siteUrl).host,
                        ].some((host) => past.host === host)
                    ) {
                        return
                    }

                    element.setAttribute(
                        'href',
                        new URL(
                            past.pathname + past.search,
                            process.env.NEXT_PUBLIC_URL,
                        ).toString(),
                    )
                },
            })
            .on('head', {
                element(element) {
                    element.prepend(
                        /* html */ `
                    <script>
                        window.addEventListener('load', () => {
                            setTimeout(() => {
                                    document.querySelectorAll('a[href="https://framer.com/"]').forEach((el) => {
                                    el.remove()
                                })
                            }, 100)
                        })
                    </script>
                    <script async src="https://cdn.splitbee.io/sb.js"></script>
                    `,
                        {
                            html: true,
                        },
                    )
                },
            })
            .on('link', {
                element(element) {
                    if (element.getAttribute('rel') === 'canonical') {
                        const u = new URL(
                            canonicalPath || req.nextUrl.pathname,
                            process.env.NEXT_PUBLIC_URL,
                        ).toString()
                        element.setAttribute('href', u)
                    }
                },
            })
    }
}

const landingPageFramerUrl = 'https://impatient-benefits-535602.framer.app/'
const framerSites = {
    [landingPageFramerUrl]: {
        rewriter: rewriterForFramerSite(landingPageFramerUrl, '/'),
        paths: [
            // list all top level pages of your Framer website
            '/',
            // '/home',
            '/features',
            '/pricing',
        ],
    },
    'https://01cfe490-a00d-434e.blog-base-path.notaku.site': {
        paths: [
            //
            '/blog',
        ],
    },
}

const pagesToSite = new Map(
    Object.entries(framerSites).flatMap(([siteUrl, config]) => {
        const { paths, ...rest } = config
        return paths.map((p) => [p, { siteUrl, ...rest }])
    }),
)

export default async function middleware(req: NextRequest, ev: NextFetchEvent) {
    const base = req.nextUrl.origin
    // const xxx = process.env.NEXT_PUBLIC_ENV
    // console.log('yyy', xxx)
    try {
        const { pathname = '', search, host } = req.nextUrl

        
        if (pathname === '/home') {
            const rewriter = rewriterForFramerSite(landingPageFramerUrl, '/')
            const res = await fetch(
                landingPageFramerUrl,
                // req,
            )
            return rewriter(req).transform(res)
        }


        const isBrowserEntry =
            req.method === 'GET' &&
            req.headers.get('accept')?.includes('text/html')
        if (isBrowserEntry && pathname === '/') {
            const res = new NextResponse(null)

            const supabase = createMiddlewareClient({ req, res })
            const {
                data: { session },
            } = await supabase.auth.getSession()
            let redirectPath = '/dashboard'

            if (session?.user) {
                // redirect to /editor
                let redirect = NextResponse.redirect(
                    new URL(redirectPath, base),
                )
                // copy headers from res to redirect
                res.headers.forEach((v, k) => {
                    redirect.headers.set(k, v)
                })
                redirect.headers.delete('x-middleware-next')
                return redirect
            }
        }

        for (let [page, c] of pagesToSite) {
            const { siteUrl } = c
            // top level / only works on one website
            if (page === '/' && pathname !== '/') {
                continue
            }
            if (pathname !== page && !pathname.startsWith(page + '/')) {
                continue
            }
            console.log(`rewriting ${pathname} to ${siteUrl}`)
            const u = new URL(pathname + req.nextUrl.search, siteUrl).toString()
            const rewriter = c?.rewriter?.(req)
            if (rewriter) {
                const res = await fetch(u, {
                    // headers: req.headers,
                    body: req.body,
                    method: req.method,
                    signal: req.signal,
                    keepalive: req.keepalive,
                    cache: req.cache,
                })
                let newRes = rewriter.transform(res)
                return newRes
            } else {
                return NextResponse.rewrite(u)
            }
        }
    } catch (e: any) {
        console.error('middleware', e)
        throw e
        return NextResponse.next()
    }
}
function safeUrl(arg0: any) {
    try {
        return new URL(arg0)
    } catch (e) {
        return null
    }
}
