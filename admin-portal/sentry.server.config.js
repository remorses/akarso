// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
    dsn: "https://23002eceab539857c43d00f5ec1fb826@o4505699631431680.ingest.sentry.io/4505699633004544",

    tracesSampleRate: 0.01,
    // onFatalError: onUncaughtException,
    beforeSend(event) {
        // do not send in development
        if (process.env.NEXT_PUBLIC_ENV === 'development') {
            return null
        }
        return event
    },
    integrations(integrations) {
        return integrations.filter(
            (integration) => integration.id !== 'OnUncaughtException',
        )
    },
})

if (typeof process !== 'undefined' && process?.on) {
    // https://github.com/nodejs/node/issues/42154
    process.on('uncaughtException', (error) => {
        const hub = Sentry.getCurrentHub()
        hub.withScope(async (scope) => {
            scope.setLevel('fatal')
            hub.captureException(error, { originalException: error })
        })
        if (error?.['code'] === 'ECONNRESET') {
            console.log(`handled ECONNRESET ${error}`)
            return
        }
        console.error('UNCAUGHT EXCEPTION')
        console.error(error)
        // console.error(origin)
        process.exit(1)
    })
}
