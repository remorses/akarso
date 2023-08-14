import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

import { Readable } from 'node:stream'

import { notifyError } from 'website/src/lib/sentry'

import { prisma, Prisma, SubscriptionStatus } from 'db/prisma'
import { stripe } from 'website/src/lib/ssr-stripe'
import { env } from 'db/env'

// Stripe requires the raw body to construct the event.
export const config = {
    api: {
        bodyParser: false,
    },
}

const relevantEvents = new Set([
    // 'product.created',
    // 'product.updated',
    // 'price.created',
    // 'price.updated',
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
])

const webhookHandler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        res.status(405).end('Method Not Allowed, use POST\n')
        return
    }
    console.log('received stripe webhook')
    const buf = await buffer(req)
    const sig = req.headers['stripe-signature']
    const webhookSecret = env.STRIPE_WEBHOOK_SECRET
    let event: Stripe.Event

    try {
        if (!sig || !webhookSecret) return res.status(400).send('No sig')
        event = stripe.webhooks.constructEvent(buf, sig, webhookSecret)
    } catch (err: any) {
        await notifyError(err, 'stripe.webhooks.constructEvent')
        return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    if (relevantEvents.has(event.type)) {
        try {
            switch (event.type) {
                // case 'product.created':
                // case 'product.updated':
                //     await upsertProductRecord(
                //         event.data.object as Stripe.Product,
                //     )
                //     break
                // case 'price.created':
                // case 'price.updated':
                //     await upsertPriceRecord(
                //         event.data.object as Stripe.Price,
                //     )
                //     break
                case 'customer.subscription.created':
                case 'customer.subscription.updated':
                case 'customer.subscription.deleted': {
                    const subscription = event.data
                        .object as Stripe.Subscription
                    let orgId = subscription.metadata.orgId
                    await manageSubscriptionStatusChange(
                        subscription.id,
                        subscription.customer as string,
                        orgId,
                        // event.type === 'customer.subscription.created',
                    )
                    break
                }
                case 'checkout.session.completed': {
                    const checkoutSession = event.data
                        .object as Stripe.Checkout.Session
                    let orgId = checkoutSession?.metadata?.orgId
                    if (!orgId) {
                        throw new Error(
                            'No orgId found in checkout.session.completed metadata',
                        )
                    }
                    if (checkoutSession.mode === 'subscription') {
                        const subscriptionId = checkoutSession.subscription
                        await manageSubscriptionStatusChange(
                            subscriptionId as string,
                            checkoutSession.customer as string,
                            orgId,
                        )
                    }
                    break
                }
                default:
                    throw new Error('Unhandled relevant event!')
            }
        } catch (error) {
            await notifyError(error, 'stripe webhook')
            return res
                .status(500)
                .send('Webhook error: "Webhook handler failed. View logs."')
        }
    }

    res.status(200).json({ received: true })
}

export default webhookHandler

async function manageSubscriptionStatusChange(
    subscriptionId: string,
    customerId: string,
    orgId: string,
    // createAction = false,
) {
    // const data = event.data.object as Stripe.Checkout.Session
    if (!orgId) {
        throw new Error('No orgId found in metadata')
    }
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['default_payment_method', 'items.data'],
    })

    console.log(
        `subscription update for ${orgId}, status:${subscription.status}, cancel at: ${subscription.cancel_at}`,
    )

    await Promise.all(
        subscription.items.data.map(async (item) => {
            const variantId = String(item.price.id)
            const create: Prisma.SubscriptionUncheckedCreateInput = {
                subscriptionId: subscription.id,
                orgId,
                // unit_amount: item.price.unit_amount,
                // currency: item.price.currency,
                status: convertSubscriptionStatus(subscription.status),
                productId: String(item.price.product),
                // orderId: '',
                variantId,
                // provider: 'stripe',
                variantName: item?.price?.nickname || '',
                endsAt: timestampToDate(subscription.cancel_at),
                quantity: item.quantity || 1,
                // metadata: subscription.metadata,
                // cancel_at_period_end: subscription.cancel_at_period_end,
                // canceled_at: timestampToDate(subscription.canceled_at!),
                // cancel_at: timestampToDate(subscription.cancel_at!),
                // start_date: timestampToDate(subscription.start_date!),
                // ended_at: timestampToDate(subscription.ended_at!),
                // trial_start: timestampToDate(subscription.trial_start!),
                // trial_end: timestampToDate(subscription.trial_end!),
            }
            await prisma.subscription.upsert({
                where: {
                    subscriptionId_variantId: {
                        subscriptionId: subscription.id,
                        variantId,
                    },
                },
                create,
                update: create,
            })
        }),
    )

    // TODO maybe need to copy the stripe billing details from the first payment method to the customer object. some projects do it, dont know why
}

function convertSubscriptionStatus(status: Stripe.Subscription.Status) {
    const map: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
        trialing: 'on_trial',
        canceled: 'cancelled',
        incomplete: 'unpaid',
        active: 'active',
        past_due: 'past_due',
        unpaid: 'unpaid',
        paused: 'paused',
        incomplete_expired: 'expired',
    }

    return map[status]
}

const timestampToDate = (t?: number | null) => {
    if (!t) {
        return null
    }
    return new Date(t * 1000)
}

async function buffer(readable: Readable) {
    const chunks: Buffer[] = []
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
    }
    return Buffer.concat(chunks)
}
