export function createStepPath({ host, hash, provider, step }) {
    if (!hash) {
        throw new Error(`no hash passed`)
    }
    return `/token/${hash}/provider/${provider}/step/${step}`
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
