import { updateOrCreateSSOConnection } from 'akarso'

// IMPORTANT: this code must run on the server
const { url } = await updateOrCreateSSOConnection({
    // TODO: replace with your own url
    callbackUrl: `https://example.com/api/sso-callback`,
    domain: 'example.com', // the team SSO domain
    identifier: teamId,
    secret: 'REPLACE_ME_SECRET', // akarso secret
})

redirect(url)
