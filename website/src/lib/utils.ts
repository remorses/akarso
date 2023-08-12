import { env } from 'db/env'

export function createStepPath({ host, token, provider, step }) {
    return `/tenant/${host}/token/${token}/provider/${provider}/step/${step}`
}

export function createLoginRedirectUrl({ signupReason = '', redirectTo = '' }) {
    const url = new URL('/api/auth/callback', env.NEXT_PUBLIC_URL)
    url.searchParams.set('signupReason', signupReason)
    url.searchParams.set('redirectTo', redirectTo)
    return url.toString()
}

export function slugKebabCase(str) {
    return str
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/\//g, '-')
        .replace(/\./g, '-')
        .replace(/-+/g, '-')
        .toLowerCase()
}

// @ts-ignore
import redirectJsCode from 'website/src/snippets/redirect.raw.js'

export function generateCodeSnippet({ host, secret }) {
    let code = redirectJsCode
        .replaceAll('REPLACE_ME_SECRET', secret)
        .replaceAll('REPLACE_ME_HOST', host)
    return code
}
