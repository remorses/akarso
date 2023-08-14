import { loadStripe } from '@stripe/stripe-js'
import {
    Button,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    RadioGroup,
    Tab,
    Tabs,
    useDisclosure,
} from '@nextui-org/react'
import { useThrowingFn } from 'beskar/landing'
import classNames from 'classnames'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { createStripeCheckoutSession } from 'website/src/pages/api/stripe/stripe-functions'
import { FREE_CONNECTIONS, Plan, env, prices } from 'db/env'
import { RadioCard } from 'website/src/components/form'
import { useProps } from 'website/src/lib/hooks'

export function Banner({ orgId }) {
    const router = useRouter()
    const { site, subs } = useProps()
    const { isOpen, onClose, onOpen, onOpenChange } = useDisclosure()
    const [billing, setBilling] = useState('monthly')
    const [plan, setPlan] = useState<Plan>('startup')
    let price = 0
    if (plan === 'startup') {
        price +=
            billing === 'yearly'
                ? prices.yearlyStartup.usd
                : prices.monthlyStartup.usd
    }
    if (plan === 'business') {
        price +=
            billing === 'yearly'
                ? prices.yearlyBusiness.usd
                : prices.monthlyBusiness.usd
    }
    const { fn, isLoading } = useThrowingFn({
        async fn() {
            const stripe = await loadStripe(
                env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
            )
            const { sessionId } = await createStripeCheckoutSession({
                orgId,
                callbackUrl: new URL(
                    router.asPath,
                    env.NEXT_PUBLIC_URL,
                ).toString(),
                addons: [],
                yearlyBilling: billing === 'yearly',
            })
            onClose()
            await stripe?.redirectToCheckout({ sessionId })
        },
    })

    const upgrade = (
        <button
            // href={`/org/${orgId}/upgrade`}
            // onClick={fn}
            onClick={onOpen}
            className={classNames(
                'inline appearance-none px-[6px] py-[1px] transition-all mx-1 bg-gray-100/10 hover:bg-gray-100/30 rounded',
                isLoading && 'opacity-50 pointer-events-none',
            )}
        >
            {isLoading ? 'loading...' : 'upgrade'}
        </button>
    )
    return null
    if (subs?.length) {
        return null
    }

    return (
        <>
            <div className='font-semibold text-white bg-gradient-to-r from-cyan-600 gap-1 to-sky-600 text-sm absolute top-0 shrink-0 h-[40px] bg-black w-full flex items-center justify-center'>
                {
                    <div className=''>
                        {upgrade} to create more than {FREE_CONNECTIONS} SSO
                        connections
                    </div>
                }
            </div>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    <>
                        <ModalHeader className='flex flex-col gap-1'>
                            Upgrade
                        </ModalHeader>
                        <ModalBody className='gap-6'>
                            <div className=''>Choose a plan</div>
                            <RadioGroup
                                onValueChange={setPlan as any}
                                value={plan}
                            >
                                <RadioCard
                                    value='startup'
                                    description='max 20 connections, all customizations'
                                >
                                    Startup
                                </RadioCard>
                                <RadioCard
                                    value='business'
                                    description='max 200 connections, all customizations'
                                >
                                    Business
                                </RadioCard>
                            </RadioGroup>
                            <div className=''>
                                How often do you want to pay?
                            </div>
                            <Tabs
                                selectedKey={billing}
                                onSelectionChange={setBilling as any}
                            >
                                <Tab key='monthly' title='Monthly Billing' />
                                <Tab key='yearly' title='Yearly Billing' />
                            </Tabs>
                        </ModalBody>
                        <ModalFooter className='items-center'>
                            <Button
                                onClick={fn}
                                isLoading={isLoading}
                                color='primary'
                            >
                                Upgrade at{' '}
                                <span className='font-mono'>${price}</span> a
                                month
                            </Button>
                        </ModalFooter>
                    </>
                </ModalContent>
            </Modal>
        </>
    )
}
