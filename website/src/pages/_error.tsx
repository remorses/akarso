import { notifyError } from '@/lib/sentry'
import ErrorPage from 'next/error'
import React from 'react'

export default class _Error extends React.Component<any, any> {
    static async getInitialProps(ctx) {
        if (ctx.err) {
            notifyError(ctx.err)
        }
        return ErrorPage.getInitialProps(ctx)
    }
    render() {
        return <ErrorPage statusCode={this.props.statusCode || ''} />
    }
}
