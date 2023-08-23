import { env } from 'db/env'

export function createStepPath({ host, token, provider, step }) {
    return `/tenant/${host}/session/${token}/provider/${provider}/step/${step}`
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

export function generateCodeSnippet({ host, secret }) {
    // @ts-ignore
    let redirectCode: any = require('website/src/snippets/redirect.raw.js')
    // @ts-ignore
    let callbackCode: any = require('website/src/snippets/callback.raw.js')
    // @ts-ignore
    let loginCode: any = require('website/src/snippets/login.raw.js')
    loginCode = loginCode.default || loginCode
    redirectCode = redirectCode.default || redirectCode
    callbackCode = callbackCode.default || callbackCode
    redirectCode = redirectCode.replaceAll('REPLACE_ME_SECRET', secret)
    callbackCode = callbackCode.replaceAll('REPLACE_ME_SECRET', secret)

    return { redirectCode, callbackCode, loginCode }
}

export const isDev = env.NEXT_PUBLIC_ENV === 'development'

export function safeJsonParse(str) {
    try {
        return JSON.parse(str)
    } catch (error) {
        return null
    }
}

export function isTruthy<T>(val: T | undefined | null | false): val is T {
    return !!val
}

export function daysDistance(a: Date, b: Date) {
    return Math.floor(Math.abs(a.getTime() - b.getTime()) / (1000 * 3600 * 24))
}
