'use client'
import { ChooseProvider } from '@/components/ChooseProvider'
import { Domain } from 'admin-portal/src/components/Domain'

export default function Page({ params: { token, host } }) {
    return <Domain />
}
