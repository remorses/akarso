"poor man's use server"
import { AppError, KnownError } from 'website/src/lib/errors'
import { requireAuth } from 'website/src/lib/ssr'
import { wrapMethod } from '../functions'
import { getNodejsContext as getContext } from 'server-actions-for-next-pages/context'
import { Plan, env, prices } from 'db/env'
import { prisma } from 'db/prisma'
import { upsertStripeCustomer, stripe } from 'website/src/lib/ssr-stripe'
import { isTruthy } from 'website/src/lib/utils'

export { wrapMethod }

export async function createStripeCheckoutSession({
    orgId,
    plan = 'startup' as Plan,
    yearlyBilling = false,
    callbackUrl,
    addons = [],
}) {
    const { req, res } = getContext()
    const { session, redirect, userId, email, supabase } = await requireAuth({
        req,
        res,
    })

    if (!email) {
        throw new KnownError(`You need to be logged in to create a session`)
    }

    const customerId = await upsertStripeCustomer({
        userId,
        orgId,
        email,
    })

    const metadata = {
        orgId,
        userId,
        email,
    }
    const price = (() => {
        if (plan === 'startup') {
            return yearlyBilling
                ? prices.yearlyStartup.id
                : prices.monthlyStartup.id
        }
        if (plan === 'business') {
            return yearlyBilling
                ? prices.yearlyBusiness.id
                : prices.monthlyBusiness.id
        }
        throw new AppError(`Unknown plan ${plan}`)
    })()

    const sess = await stripe.checkout.sessions
        .create({
            // payment_method_types: ['card'],
            customer: customerId,
            billing_address_collection: 'required',
            customer_update: {
                name: 'auto',
                address: 'auto',
            },
            // automatic_tax: {
            //     enabled: true,
            // },
            // allow adding VAT code in invoice
            tax_id_collection: {
                enabled: true,
            },

            line_items: [
                {
                    price,
                    quantity: 1,
                },
                ...addons
                    .map((addon) => {
                        let price = ''
                        // if (addon === 'ai') {
                        //     price = yearlyBilling
                        //         ? prices.yearlyAiIntegration.id
                        //         : prices.monthlyAiIntegration.id
                        // }
                        // if (addon === 'sso') {
                        //     price = yearlyBilling
                        //         ? prices.yearlySSOIntegration.id
                        //         : prices.monthlySSOIntegration.id
                        // }
                        if (!price) {
                            return
                        }
                        return {
                            quantity: 1,
                            price,
                        }
                    })
                    .filter(isTruthy),
                // TODO show addons in the dashboard? on the moment of first upgrade or later?
                // {
                //     price: prices.aiIntegration,
                //     quantity: 1,
                // },
            ],
            mode: 'subscription',
            allow_promotion_codes: true,
            // TODO what is stripe client_reference_id?
            client_reference_id: orgId,
            metadata,
            subscription_data: {
                // trial_from_plan: true,

                metadata,
            },
            success_url: callbackUrl,
            cancel_url: callbackUrl,
        })
        .catch((e) => {
            throw new AppError(
                `Error creating checkout session: ${e.message}`,
                { cause: e },
            )
        })

    return { sessionId: sess.id }
}

export async function createStripePortal({ orgId: orgId, callbackPath }) {
    const { req, res } = getContext()
    const { userId, email } = await requireAuth({ req, res })
    if (!userId) {
        throw new KnownError(`You need to be logged in to create a portal`)
    }
    stripe.paymentIntents.create
    const customerId = await upsertStripeCustomer({
        userId,
        orgId: orgId,
        email,
    })

    const { url } = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: new URL(callbackPath, env.NEXT_PUBLIC_URL).toString(),
    })
    return { url }
}
