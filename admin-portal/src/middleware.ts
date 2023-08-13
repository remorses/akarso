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

    const hostname = req.headers.get('host')!

    const path = url.pathname

    return NextResponse.rewrite(
        new URL(`/tenant/${hostname}${path}`, req.url),
        {},
    )
    // TODO rewrite to long path after nextjs fixes their shit: https://github.com/vercel/next.js/issues/49442
}
