<div align='center'>
    <br/>
    <br/>
    <h3>akarso</h3>
    <p>Admin portal to make it easy for you user to setup SSO</p>
    <br/>
    <br/>
</div>

Akarso is an alternative to the [WorkOS admin portal](https://workos.com/admin-portal) built on top of Supabase.

## Why

If you use SSO with Supabase now you have to ask your users to

-   create an application in their SSO provider
-   Make them send the metadata file or url
-   Run `supabase sso add` with their SSO metadata
-   Ask them to try to sign in
-   Troubleshoot why their SSO integration is not working
-   Spend hours of support to fix their SSO integration

Using Akarso instead you can add a button `Setup SSO` in your application that redirects to the Akarso admin portal where your users can setup SSO in a few clicks.

Akarso will guide the user thorough the whole process and will collect the required information to setup SSO in Supabase.

Then akarso will redirect to your application with the SSO provider details (`ssoProviderId` and `identifier`) in the params, here you can update your team database entity with the SSO provider id.

## How it works

-   Sign up at https://akarso.co
-   Create and Admin Portal, choosing a slug and adding your supabase access token
-   Akarso will host an admin portal at `slug.tenants.akarso.co` where your users can setup SSO with your app
-   You can redirect to the Admin Portal from your application with the `akarso` npm package, read how to setup it [here]()
