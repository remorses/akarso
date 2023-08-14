import { loadStripe } from '@stripe/stripe-js'
import {
    Button,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
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
import { env, prices } from 'db/env'

export function Banner({ freeTrialEndsInDays, subs, orgId }) {
    const router = useRouter()
    const { isOpen, onClose, onOpen, onOpenChange } = useDisclosure()
    const [billing, setBilling] = useState('monthly')
    const price =
        billing === 'yearly' ? prices.yearlyPro.usd : prices.monthlyPro.usd
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
    if (subs?.length) {
        return null
    }

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

    return (
        <>
            <div className='font-semibold text-white bg-gradient-to-r from-cyan-600 gap-1 to-sky-600 text-sm absolute top-0 shrink-0 h-[40px] bg-black w-full flex items-center justify-center'>
                {freeTrialEndsInDays ? (
                    <div className=''>
                        {upgrade} to not lose access in {freeTrialEndsInDays}{' '}
                        {freeTrialEndsInDays === 1 ? 'day' : 'days'}
                    </div>
                ) : (
                    <div className=''>
                        Your free trial expired, {upgrade} to not lose access{' '}
                    </div>
                )}
            </div>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className='flex flex-col gap-1'>
                                Upgrade
                            </ModalHeader>
                            <ModalBody>
                                <div className=''>
                                    How often do you want to pay?
                                </div>
                                <Tabs
                                    selectedKey={billing}
                                    onSelectionChange={setBilling as any}
                                >
                                    <Tab key='yearly' title='Yearly Billing' />
                                    <Tab
                                        key='monthly'
                                        title='Monthly Billing'
                                    />
                                </Tabs>
                            </ModalBody>
                            <ModalFooter className='items-center'>
                                <Button
                                    onClick={fn}
                                    isLoading={isLoading}
                                    color='primary'
                                >
                                    Upgrade at{' '}
                                    <span className='font-mono'>${price}</span>{' '}
                                    a month
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    )
}
