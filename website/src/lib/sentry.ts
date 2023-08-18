import * as Sentry from '@sentry/core'

import { AppError, KnownError } from './errors'

export function notifyError(error, msg?: string) {
    console.error(msg, error)
    // if (msg && error?.message) {
    //     error.message = msg + ': ' + error?.message
    // }
    Sentry.captureException(error, { extra: { msg } })
}

export const wrapMethod = (method, meta) => {
    return async (...args) => {
        try {
            const result = await method(...args)

            return result
        } catch (e) {
            if (e instanceof KnownError) {
                throw e
            }
            await notifyError(e, `rpc ${meta.name} in ${meta.pathname}`)
            if (e instanceof AppError) {
                console.error(e)
                throw e
            }
            // throw a generic error like "Something went wrong" so that user does not see the precise error
            throw new Error('Something went wrong')
        }
    }
}

export function wrapApiHandler(fn) {
    return async function wrappedFunction(req, res) {
        try {
            return await fn(req, res)
        } catch (e) {
            if (e instanceof KnownError) {
                throw e
            }

            await notifyError(e, `api ${req?.url}`)
            throw e
        }
    }
}
