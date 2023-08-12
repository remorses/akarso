import { ProviderSetupParams } from '@/lib/hooks'
import { SignJWT } from 'jose'

async function main() {
    const payload: ProviderSetupParams = {
        callbackUrl: 'http://localhost:3000/api/auth/callback',
        domain: 'localhost',
        metadata: {
            orgId: 'example',
        },
    }
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('2h')
        .sign(new TextEncoder().encode('secret'))
    const url = `http://localhost:4040/tenant/localhost/token/${encodeURIComponent(
        token,
    )}`
    console.log(`example url:`, url)
}

main()
