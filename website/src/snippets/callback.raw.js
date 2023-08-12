import { getCallback } from 'akarso'

app.get('/api/sso-callback', async (req, res) => {
    const { token } = req.query
    const { identifier, ssoProviderId } = await getCallback({
        token,
        secret: 'REPLACE_ME_SECRET',
    })

    // connect SSO provider to the team entity
    await prisma.team.update({
        where: { id: identifier },
        data: { ssoProviderId },
    })

    // redirect user back to dashboard
    res.redirect(`/team/${identifier}`)
})
