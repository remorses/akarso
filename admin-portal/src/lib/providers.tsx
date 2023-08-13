'use client'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'

import classNames from 'classnames'

import { useCopyToClipboard, useSetupParams } from '@/lib/hooks'
import { SiteData } from '@/lib/ssr'
import { camel2title } from '@/lib/utils'
import { useStore } from '@nanostores/react'
import { Button, Input } from '@nextui-org/react'
import {
    Auth0,
    Cloudflare,
    Google,
    Keycloak,
    Microsoft,
    Okta,
} from 'admin-portal/src/components/icons'
import { metadataUrlAtom, metadataXmlAtom } from 'admin-portal/src/lib/atoms'
import { CheckIcon, UploadIcon } from 'lucide-react'
import NextImage from 'next/image'
import { Image } from '@nextui-org/react'

import {
    CSSProperties,
    ComponentPropsWithoutRef,
    Fragment,
    useRef,
    useState,
} from 'react'

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
                            Open the Google Workspace Web and mobile apps{' '}
                            <a
                                href='https://admin.google.com/'
                                target='_blank'
                                className='underline'
                            >
                                console
                            </a>
                            .
                        </div>
                        <Img
                            src={require('admin-portal/src/img/supa/sso-gsuite-step-01.png')}
                        />
                        <div>
                            In your Google Admin dashboard, select "Apps" from
                            the sidebar menu, and then select "Web and Mobile
                            Apps" from the list. On this page, select "Add App"
                            and then "Add custom SAML app".
                        </div>
                        <Img
                            src={require('admin-portal/src/img/supa/sso-gsuite-step-02.png')}
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
                            src={require('admin-portal/src/img/supa/sso-gsuite-step-03.png')}
                        />
                    </>
                ),
            },
            {
                title: `Upload Identity Provider Metadata`,
                addsMetadata: true,
                content: (
                    <>
                        <div>
                            Select the "Download Metadata" button to download
                            the metadata file, and upload it below. Click
                            "Continue".
                        </div>
                        <Img
                            src={require('admin-portal/src/img/supa/sso-gsuite-step-04.png')}
                        />
                        <UploadButton accept='xml' />
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
                        <Field k={'acsUrl'} />
                        <Field k={'entityId'} />
                        <Field
                            noCopy
                            label='Name ID format'
                            value='PERSISTENT'
                        />
                        <Field
                            noCopy
                            label='Name ID'
                            value='Basic Information > Primary email'
                        />
                        <Img
                            src={require('admin-portal/src/img/supa/sso-gsuite-step-05.png')}
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
                            src={require('admin-portal/src/img/supa/sso-gsuite-step-06.png')}
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

                        <div className=''>
                            Turn this service ON for the correct organizational
                            units in your Google Application. Save any changes.
                            Note that Google may take up to 24 hours to
                            propagate these changes, and the connection may be
                            inactive until the changes have propagated.
                        </div>
                        <Img
                            src={require('admin-portal/src/img/supa/sso-gsuite-step-07.png')}
                        />
                    </>
                ),
            },
        ],
    },
    okta: {
        name: 'Okta',
        icon: <Okta />,
        steps: [
            {
                title: `Create SAML Integration`,
                content: (
                    <>
                        <div>
                            In your Okta Application Dashboard go to
                            "Applications" in the sidebar. Click "Create App
                            Integration".
                        </div>
                        <Img
                            src={require('admin-portal/src/img/supa/sso-okta-step-01.png')}
                        />
                    </>
                ),
            },
            {
                title: `Use SAML 2.0`,
                content: (
                    <>
                        <div>
                            Choose SAML 2.0 from the next screen and click Next.
                        </div>
                        <Img
                            src={require('admin-portal/src/img/supa/sso-okta-step-02.png')}
                        />
                    </>
                ),
            },
            {
                title: `Give name to application`,
                content: (
                    <>
                        <div>
                            Give your application an App Name and click Next.
                        </div>
                        <Img
                            src={require('admin-portal/src/img/supa/sso-okta-step-03.png')}
                        />
                    </>
                ),
            },
            {
                title: `Configure Application`,
                content: (
                    <>
                        <div className=''>
                            Enter the following values in the SAML Settings
                            section on the next screen:
                        </div>
                        <div className='space-y-3'>
                            <Field k='acsUrl' label='Single sign on URL' />
                            <Field
                                label='Audience URI (SP Entity ID)'
                                k='entityId'
                            />
                            <Field label='Default RelayState' k='relayState' />
                            <Field
                                label='Use this for Recipient URL and Destination URL'
                                noCopy
                                value='✔️'
                            />
                            <Field
                                noCopy
                                label='Default RelayState'
                                k='relayState'
                            />
                            <Field
                                label='Name ID format'
                                noCopy
                                value='EmailAddress'
                            />
                            <Field
                                noCopy
                                label='Application username'
                                value='Email'
                            />
                            <Field
                                noCopy
                                label='Update application username on'
                                value='Create and update'
                            />
                        </div>
                        <Img
                            src={require('admin-portal/src/img/supa/sso-okta-step-04.png')}
                        />
                    </>
                ),
            },
            {
                title: `Configure Attribute Mapping`,
                content: (
                    <>
                        <div>
                            Under the Attribute Statements section, you have to
                            configure the following attributes:
                        </div>
                        <div className=''>
                            <div className='flex justify-between'>
                                <Field value='email' />
                                <Field value='user.email' />
                            </div>
                            <div className='flex justify-between'>
                                <Field value='first_name' />
                                <Field value='user.firstName' />
                            </div>
                            <div className='flex justify-between'>
                                <Field value='last_name' />
                                <Field value='user.lastName' />
                            </div>
                            {/* <div className='flex justify-between'>
                                <Field value='user_name' />
                                <Field value='user.login' />
                            </div> */}
                        </div>
                        <Img
                            src={require('admin-portal/src/img/supa/sso-okta-step-05.png')}
                        />
                    </>
                ),
            },
            {
                title: `Copy the metadata URL`,
                addsMetadata: true,
                content: (
                    <>
                        <div>
                            On the next screen select I'm an Okta customer
                            adding an internal app and click Finish.
                        </div>
                        <Img
                            src={require('admin-portal/src/img/supa/sso-okta-step-06.png')}
                        />
                        <div className=''>
                            Copy the metadata URL and paste it here below.
                        </div>
                        <MetadataUrl />
                    </>
                ),
            },
        ],
    },
    microsoft: {
        inactive: true,
        name: 'Azure AD',
        icon: <Microsoft />,
    },
    auth0: {
        inactive: true,
        name: 'Auth0',
        icon: <Auth0 />,
    },
    keycloak: {
        inactive: true,
        name: 'Keycloak',
        icon: <Keycloak />,
    },
    cloudflare: {
        inactive: true,
        name: 'Cloudflare',
        icon: <Cloudflare />,
    },
} as const

export type Provider = keyof typeof providers

export function Img({ src, ...rest }) {
    const url = src?.default?.src || src?.src
    return (
        <div className='p-8 -mx-8 my-6 bg-gray-100 rounded-md'>
            <div className='overflow-hidden items-center flex relative shadow-xl rounded-md flex-col'>
                <Zoom
                    // overlayBgColorEnd='rgba(0, 0, 0, 0.55)'
                    // overlayBgColorStart='rgba(0, 0, 0, 0)'
                    IconZoom={Fragment}
                    IconUnzoom={Fragment}
                    zoomMargin={40}
                    // wrapStyle={style}
                >
                    <NextImage
                        className={classNames(
                            'overflow-hidden relative shadow-xl',
                            url.includes('boxy') && ' min-w-[105%]',
                        )}
                        placeholder='blur'
                        src={src?.default || src}
                        alt=''
                        {...rest}
                    />
                </Zoom>
            </div>
        </div>
    )
}

export function UploadButton({
    accept = '*',
    children,
    ...rest
}: {
    bg?: string
    children?: React.ReactNode
    accept?: string
} & ComponentPropsWithoutRef<typeof Button>) {
    const [filename, setFilename] = useState('')

    const inputRef = useRef<any>()

    return (
        <>
            <input
                type='file'
                onChange={async (e) => {
                    const target: HTMLInputElement = e.target
                    const file = target.files?.[0]

                    if (!file) {
                        console.log('no file')
                        return
                    }
                    setFilename(file.name)
                    const filename = encodeURIComponent(file.name)
                    const string = await file.text()
                    metadataXmlAtom.set(string)
                }}
                accept={accept}
                ref={inputRef}
                style={{ display: 'none' }}
            />
            {/* @ts-ignore */}
            <Button
                onClick={() => {
                    inputRef.current.click()
                }}
                endContent={<UploadIcon className='w-4' />}
                className='my-4'
                {...rest}
                // isLoading={isLoading}
            >
                {children || 'Upload Metadata File'}
            </Button>
            {/* <div className="mt-2 text-sm opacity-60">{filename}</div> */}
        </>
    )
}

export function Field({
    k = '' as keyof SiteData,
    value = '',
    label = '',
    noCopy = false,
}) {
    const data = useSetupParams()
    // console.log({ data, k })
    if (!label) {
        label = camel2title(k)
    }
    if (!value) {
        value = data[k]
    }
    return (
        <div className='space-y-2 my-1 '>
            <div className=''>{label}</div>
            <Input
                className='font-mono  text-sm'
                labelPlacement='outside'
                endContent={!noCopy && <CopyButton text={value} />}
                value={value}
                // label={label}
                isReadOnly
            ></Input>
        </div>
    )
}

export function MetadataUrl({}) {
    const data = useSetupParams()
    // console.log({ data, k })
    const value = useStore(metadataUrlAtom)
    return (
        <div className='space-y-2 my-1 '>
            <div className=''>Metadata URL</div>
            <Input
                placeholder='https://example.com/metadata.xml'
                className=''
                labelPlacement='outside'
                onValueChange={(x) => metadataUrlAtom.set(x)}
                value={value}
                // label={label}
            ></Input>
        </div>
    )
}

export const CopyButton = ({
    text,
    style = {} as CSSProperties,
    size = 18,
    className = '',
    ...props
}) => {
    const { hasCopied, copy } = useCopyToClipboard(text)
    const As: any = hasCopied ? CheckIcon : CopyIcon
    return (
        <button
            className={classNames(
                'text-sm shrink-0 items-center gap-1 font-medium',
                'flex cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-gray-700 px-1 appearance-none',
                className,
            )}
            type='button'
            onClick={copy}
            {...props}
        >
            <As style={{ ...style, width: size, height: size }} />
            {hasCopied ? <div className=''>copied</div> : 'copy'}
        </button>
    )
}

function CopyIcon({ ...rest }) {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            className='w-5 h-5'
            viewBox='0 0 20 20'
            fill='currentColor'
            {...rest}
        >
            <path d='M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z' />
            <path d='M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z' />
        </svg>
    )
}
