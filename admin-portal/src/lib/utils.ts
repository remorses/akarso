export function createStepPath({ host, token, provider, step }) {
    return `/token/${token}/provider/${provider}/step/${step}`
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
