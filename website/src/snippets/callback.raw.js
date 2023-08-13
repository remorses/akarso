import { getAkarsoCallbackResult } from 'akarso'

app.get('/api/sso-callback', async (req, res) => {
    const { token } = req.query
    const { identifier, ssoProviderId, domain } = await getAkarsoCallbackResult(
        {
            token,
            secret: 'REPLACE_ME_SECRET',
        },
    )

    // connect SSO provider to the team entity
    await prisma.team.update({
        where: { teamId: identifier },
        data: { ssoProviderId, ssoDomain: domain },
    })

    // redirect user back to dashboard
    res.redirect(`/team/${identifier}`)
})
