import { createOrUpdateSSOConnection } from 'akarso'

// IMPORTANT: this code must run on the server
const { url } = await createOrUpdateSSOConnection({
    // TODO: replace with your own url
    callbackUrl: `https://example.com/api/sso-callback`,
    identifier: teamId, // your team entity identifier
    // TODO use env var instead
    secret: 'REPLACE_ME_SECRET', // your akarso secret
})

redirect(url)
