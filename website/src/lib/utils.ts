export function createStepPath({ host, token, provider, step }) {
    return `/tenant/${host}/token/${token}/provider/${provider}/step/${step}`
}
