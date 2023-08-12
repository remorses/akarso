export function createStepPath({ host, token, provider, step }) {
    return `/token/${token}/provider/${provider}/step/${step}`
}
