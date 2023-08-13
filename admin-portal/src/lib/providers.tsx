'use client'
import 'react-medium-image-zoom/dist/styles.css'
import Zoom from 'react-medium-image-zoom'

import classNames from 'classnames'

import {
    useState,
    useReducer,
    useRef,
    ComponentPropsWithoutRef,
    createContext,
    useContext,
    CSSProperties,
    ReactNode,
    Fragment,
} from 'react'
import Image from 'next/image'
import { Button, Input } from '@nextui-org/react'
import { metadataXmlAtom } from 'admin-portal/src/lib/atoms'
import { CheckIcon, UploadIcon } from 'lucide-react'
import {
    Auth0,
    Cloudflare,
    Google,
    Keycloak,
    Microsoft,
    Okta,
} from 'admin-portal/src/components/icons'
import { useCopyToClipboard, useSetupParams } from '@/lib/hooks'
import { SiteData } from '@/lib/ssr'
import { camel2title } from '@/lib/utils'

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
                            Open the Google Workspace Web and mobile apps
                            console.
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
                            src={require('admin-portal/src/img/supa/sso-gsuite-step-05.png')}
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
                            src={require('admin-portal/src/img/supa/sso-gsuite-step-06.png')}
                        />
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
                            src={require('admin-portal/src/img/boxy/okta/1.png')}
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
                            src={require('admin-portal/src/img/boxy/okta/2.png')}
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
                            src={require('admin-portal/src/img/boxy/okta/3.png')}
                        />
                    </>
                ),
            },
            {
                title: `Configure Application`,
                content: (
                    <>
                        <div>
                            Enter the following values in the SAML Settings
                            section on the next screen:
                            {`Single sign on URL
Audience URI (SP Entity ID)
Select EmailAddress from the Name ID format dropdown.`}
                        </div>
                        <Img
                            src={require('admin-portal/src/img/boxy/okta/4.png')}
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
                        <Img
                            src={require('admin-portal/src/img/boxy/okta/5.png')}
                        />
                    </>
                ),
            },
            {
                title: `Finish setup`,
                content: (
                    <>
                        <div>
                            On the next screen select I'm an Okta customer
                            adding an internal app and click Finish.
                        </div>
                        <Img
                            src={require('admin-portal/src/img/boxy/okta/6.png')}
                        />
                        <div className=''>
                            From your application, click Sign On tab and go to
                            the section SAML Signing Certificates Click the
                            Actions dropdown for the correct certificate and
                            click View IdP metadata. A separate window will open
                            with the metadata XML file, you can copy it to your
                            clipboard.
                        </div>
                        <Img
                            src={require('admin-portal/src/img/boxy/okta/7.png')}
                        />
                    </>
                ),
            },
        ],
    },
    microsoft: {
        inactive: true,
        name: 'Microsoft Azure',
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
                    <Image
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
