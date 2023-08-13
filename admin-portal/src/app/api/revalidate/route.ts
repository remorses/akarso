import { env } from 'db/env'
import { NextApiRequest, NextApiResponse } from 'next'
import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

if (typeof window !== 'undefined') {
    throw new Error('This file can only be run in the server')
}

export async function POST(req: NextRequest) {
    const body = (await req.json()) as {
        secret?: string
        paths?: string[]
        tags?: string[]
    }
    if (body.secret !== env.REVALIDATE_SECRET) {
        console.error('revalidate: Invalid secret', body.secret)
        return NextResponse.json(
            { revalidated: false, error: 'Invalid token' },
            { status: 401 },
        )
    }
    console.error('revalidating', body.tags, body.paths)

    const tags = body.tags || []
    const paths = body.paths || []

    try {
        await Promise.all(tags.map((x) => revalidateTag(x)))
        await Promise.all(paths.map((x) => revalidateTag(x)))

        return NextResponse.json({ revalidated: true }, { status: 200 })
    } catch (error: any) {
        console.error(error, 'revalidate')
        return NextResponse.json(
            { revalidated: false, error: error.stack },
            { status: 500 },
        )
    }
}
