import { Subscription, prisma } from 'db/prisma'

import Stripe from 'stripe'

import { AppError } from './errors'
import { env } from 'db/env'

export const stripe = new Stripe(env.STRIPE_SECRET_KEY || '', {
    // https://github.com/stripe/stripe-node#configuration
    apiVersion: '2022-11-15',
    // Register this as an official Stripe plugin.
    // https://stripe.com/docs/building-plugins#setappinfo
    appInfo: {
        name: 'Next.js Subscription Starter',
        version: '0.1.0',
    },
})

export const upsertStripeCustomer = async ({
    userId,
    orgId,
    email,
}: {
    userId: string
    email: string
    orgId: string
}) => {
    const org = await prisma.org.findFirst({
        where: { orgId, users: { some: { userId: userId } } },
    })
    if (!org) {
        throw new AppError('Team for customer not found')
    }
    // const user = org.users?.[0].user
    if (!org.stripeCustomerId) {
        const customer = await stripe.customers.create({
            email: email,
            name: org.name || '',

            metadata: {
                userId: userId,
                orgId: orgId,
            },
        })

        await prisma.org.update({
            where: { orgId: orgId },
            data: {
                stripeCustomerId: customer.id,
            },
        })
        return customer.id
    }
    return org.stripeCustomerId
}

export const getStripeCustomer = async ({ orgId }) => {
    const org = await prisma.org.findFirst({
        where: { orgId },
    })
    if (!org || !org.stripeCustomerId) {
        throw new AppError('Team not found')
    }
    // const user = org.users?.[0].user

    return org.stripeCustomerId
}
