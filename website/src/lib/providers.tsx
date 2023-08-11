import { Google } from '@/app/tenants/icons'
import Image from 'next/image'

export const providers = {
    google: {
        name: 'Google Workspace',
        icon: <Google />,
        steps: [
            {
                title: `Add Custom SAML Application`,
                content: (
                    <>
                        <div>
                            In your Google Admin dashboard, select "Apps" from
                            the sidebar menu, and then select "Web and Mobile
                            Apps" from the list. On this page, select "Add App"
                            and then "Add custom SAML app".
                        </div>
                        <Img
                            alt='Add custom SAML app'
                            src={require('@/ssoimg/google/1.png')}
                        />
                    </>
                ),
            },
            {
                title: `Enter Details for your Custom App`,
                content: (
                    <>
                        <div>
                            Enter an App name and icon (if applicable) for
                            demo.workos.com, then select "Continue".
                        </div>
                        <Img
                            alt='Add custom SAML app'
                            src={require('@/ssoimg/google/2.png')}
                        />
                    </>
                ),
            },
            {
                title: `Upload Identity Provider Metadata`,
                content: (
                    <>
                        <div>
                            Select the "Download Metadata" button to download
                            the metadata file, and upload it below. Click
                            "Continue".
                        </div>
                        <Img
                            alt='Add custom SAML app'
                            src={require('@/ssoimg/google/3.png')}
                        />
                    </>
                ),
            },
            {
                title: `Enter Service Provider Details`,
                content: (
                    <>
                        <div>
                            Submit the "ACS URL" and the "Entity ID". Click
                            "Continue"
                        </div>
                        <Img
                            alt='Add custom SAML app'
                            src={require('@/ssoimg/google/4.png')}
                        />
                    </>
                ),
            },
            {
                title: `Configure Attribute Mapping`,
                content: (
                    <>
                        <div>
                            Provide the following Attribute Mappings and select
                            "Finish":
                        </div>
                        <Img
                            alt='Add custom SAML app'
                            src={require('@/ssoimg/google/5.png')}
                        />
                    </>
                ),
            },
            {
                title: `Configure User Access`,
                content: (
                    <>
                        <div>
                            In the created SAML applications landing page,
                            select the "User Access Section".
                        </div>
                        <Img
                            alt='Add custom SAML app'
                            src={require('@/ssoimg/google/6.png')}
                        />
                        <div className=''>
                            Turn this service ON for the correct organizational
                            units in your Google Application. Save any changes.
                            Note that Google may take up to 24 hours to
                            propagate these changes, and the connection may be
                            inactive until the changes have propagated.
                        </div>
                        <Img
                            alt='Add custom SAML app'
                            src={require('@/ssoimg/google/7.png')}
                        />
                    </>
                ),
            },
        ],
    },
} as const

export type Provider = keyof typeof providers

export function Img({ src, ...rest }) {
    return (
        <div className='p-6 bg-gray-100 rounded-md'>
            <div className='overflow-hidden items-center flex relative rounded-md flex-col'>
                <Image
                    className='overflow-hidden relative min-w-[105%] shadow '
                    src={src}
                    alt=''
                    {...rest}
                />
            </div>
        </div>
    )
}
