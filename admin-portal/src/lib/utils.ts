import { env } from 'db/env'

export function createStepPath({ host, hash, provider, step }) {
    if (!hash) {
        throw new Error(`no hash passed`)
    }
    return `/session/${hash}/provider/${provider}/step/${step}`
}

export function camel2title(camelCase) {
    // no side-effects
    return (
        camelCase
            // inject space before the upper case letters
            .replace(/([A-Z])/g, function (match) {
                return ' ' + match
            })
            // replace first char with upper case
            .replace(/^./, function (match) {
                return match.toUpperCase()
            })
    )
}

export function retry<F extends Function>(n, fn: F): F {
    return async function (...args) {
        let lastError
        for (let i = 0; i < n; i++) {
            try {
                return await fn(...args)
            } catch (error) {
                console.error(error)
                lastError = error
            }
        }
        throw lastError
    } as any
}
