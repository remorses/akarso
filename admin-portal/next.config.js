const { withServerActions } = require('server-actions-for-next-pages')

const piped = pipe(withServerActions())

/** @type {import('next').NextConfig} */
const nextConfig = piped({
    reactStrictMode: false,
    experimental: {
        externalDir: true,
    },
})

function pipe(...fns) {
    return (x) => fns.reduce((v, f) => f(v), x)
}

module.exports = nextConfig
