const path = require('path')
const { withServerActions } = require('server-actions-for-next-pages')
const { withSentryConfig } = require('@sentry/nextjs')
const { withElacca } = require('elacca')

const piped = pipe(
    withElacca(), //
    withServerActions(),
    (c) =>
        withSentryConfig(
            c,
            {
                org: 'akarso',
                project: 'website',

                dryRun: process.env.NEXT_PUBLIC_ENV === 'development',
                // You can get an auth token from https://sentry.io/settings/account/api/auth-tokens/
                // The token must have `project:releases` and `org:read` scopes for uploading source maps
                authToken: process.env.SENTRY_AUTH_TOKEN,
                silent: true, //
            },
            {
                autoInstrumentAppDirectory: false,
                autoInstrumentMiddleware: false,
                autoInstrumentServerFunctions: false,
                automaticVercelMonitors: false,

                // disableServerWebpackPlugin: true,
            },
        ),
)

/** @type {import('next').NextConfig} */
const nextConfig = piped({
    reactStrictMode: false,
    output: 'standalone',
    outputFileTracing: true,
    experimental: {
        externalDir: true,
        esmExternals: false,
        outputFileTracingRoot: path.join(__dirname, '../'),
        swcPlugins: [['next-superjson-plugin', {}]],
        // outputFileTracingExcludes: {
        //     '*': [
        //         '@vercel', //
        //         'react-dom-experimental',
        //         'babel-packages',
        //         'babel',
        //         'rollup',
        //         'node-fetch',
        //     ].map((x) => '**/next/compiled/' + x),
        // },
    },
    webpack: (config, { dev }) => {
        config.module.rules.push({
            test: /\.raw\.js$/,
            use: 'raw-loader',
        })
        return config
    },
})

function pipe(...fns) {
    return (x) => fns.reduce((v, f) => f(v), x)
}

module.exports = nextConfig
