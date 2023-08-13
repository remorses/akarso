import { TokenData } from 'admin-portal/src/lib/hooks'
import { SignJWT } from 'jose'

async function main() {
    const payload: TokenData = {
        callbackUrl: 'http://localhost:3000/api/sso-callback',
        identifier: 'xxx',
        metadata: {
            orgId: 'example',
        },
    }
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('2h')
        .sign(new TextEncoder().encode('secret'))
    const url = `http://localhost:4040/session/${encodeURIComponent(
        token,
    )}`
    console.log(`example url:`, url)
}

main()
