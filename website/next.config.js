const { withServerActions } = require('server-actions-for-next-pages')
const { withSentryConfig } = require('@sentry/nextjs')


const piped = pipe(
    withServerActions(),
    withSentryConfig(c, {
        // org: 'knowledg',
        // project: 'website',
        dryRun: process.env.NEXT_PUBLIC_ENV === 'development',
        // You can get an auth token from https://sentry.io/settings/account/api/auth-tokens/
        // The token must have `project:releases` and `org:read` scopes for uploading source maps
        authToken: process.env.SENTRY_AUTH_TOKEN,
        silent: true, //
    }),
)

/** @type {import('next').NextConfig} */
const nextConfig = piped({
    experimental: {
        externalDir: true,
    },
})

function pipe(...fns) {
    return (x) => fns.reduce((v, f) => f(v), x)
}

module.exports = nextConfig
