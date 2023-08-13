import { NextRequest, NextResponse } from 'next/server'

export const config = {
    matcher: [
        /*
         * Match all paths except for:
         * 1. /api routes
         * 2. /_next (Next.js internals)
         * 3. /_static (inside /public)
         * 4. all root files inside /public (e.g. /favicon.ico)
         */
        '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
    ],
}

export default async function middleware(req: NextRequest) {
    const url = req.nextUrl

    // Get hostname of request (e.g. demo.vercel.pub, demo.localhost:3000)
    const hostname = req.headers.get('host')!

    // Get the pathname of the request (e.g. /, /about, /blog/first-post)
    const path = url.pathname

    const parts = path.split('/')
    const tokenIndex = parts.findIndex((p, i) => {
        return parts[i - 1] === 'token'
    })
    const token = parts[tokenIndex] || ''

    const hash = token.slice(0, 8)

    if (token.length > 8) {
        const newPath = path.replace(`/${token}`, '/' + hash)
        const res = NextResponse.redirect(new URL(newPath, req.url), {
            status: 307,
        })
        res.cookies.set(hash, token, {
            maxAge: 60 * 60 * 24 * 365 * 10,
            path: '/',
        })
        res.headers.set('cache-control', 'no-store')
        return res
    }

    return NextResponse.rewrite(
        new URL(`/tenant/${hostname}${path}`, req.url),
        {},
    )
    // TODO rewrite to long path after nextjs fixes their shit: https://github.com/vercel/next.js/issues/49442
    // {
    //     const token = req.cookies.get(hash)?.value

    //     if (!token) {
    //         console.log(
    //             'no token for hash',
    //             hash,
    //             req.cookies.getAll().map((x) => x.name),
    //         )
    //         return NextResponse.redirect(
    //             new URL(`/tenant/${hostname}${path}`, req.url),
    //             {},
    //         )
    //     }
    //     const newPath = path.replace(`/${hash}`, '/' + token)

    //     return NextResponse.rewrite(
    //         new URL(`/tenant/${hostname}${newPath}`, req.url),
    //         {},
    //     )
    // }
}
