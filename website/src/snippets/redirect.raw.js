
import { SignJWT } from 'jose'

const payload = {
    callbackUrl: 'http://localhost:3000/api/sso-callback',
    domain: 'example.com',
    metadata: {
        orgId: 'example',
    },
}

// IMPORTANT: this code must run on the server
const secret = 'REPLACE_ME_SECRET'

const token = encodeURIComponent(
    await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('2h')
        .sign(new TextEncoder().encode(secret)),
)

const url = `https://REPLACE_ME_HOST/tenant/localhost/token/${token}`

res.redirect(url)
