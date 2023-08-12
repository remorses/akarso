const { withServerActions } = require('server-actions-for-next-pages')

/** @type {import('next').NextConfig} */
const nextConfig = withServerActions()({
    experimental: {
        externalDir: true,
    },
})

module.exports = nextConfig
