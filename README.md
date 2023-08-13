<div align='center'>
    <br/>
    <br/>
    <h3>akarso</h3>
    <p>Implement SSO sign up with 10 lines of code</p>
    <br/>
    <br/>
</div>

Akarso is an alternative to the [WorkOS Admin Portal](https://workos.com/admin-portal) built on top of Supabase.

## Why

If you want to let your users sign in with SSO via Supabase currently you have to:

-   Ask the user to create an application in their SSO provider (Google, Azure, etc)
-   Ask them to send the metadata file or url
-   Execute the `supabase sso add` command with their SSO metadata
-   Ask them to try to sign in
-   Troubleshoot why their SSO integration is not working (there are 100 reasons why it could not work, wrong mappings, wrong ACS url, forgot to check an option in Google, etc)
-   Spend hours of support trying to fix their SSO integration, going back and forth in support chat

By instead using Akarso you can just add a button `Setup SSO` in your app that redirects to the Akarso Admin Portal where your customers can setup SSO in a few clicks.

Akarso will guide the user thorough the whole process and will collect the required information to setup SSO in Supabase.

Then akarso will redirect to your application with the SSO provider details (`ssoProviderId` and `identifier`) in the params, here you can update your team database entity with the SSO provider id.

## How to use Akarso

-   Sign up at https://akarso.co
-   Create and Admin Portal, choosing a slug and adding your supabase access token
-   Akarso will host an admin portal at `slug.tenants.akarso.co` where your users can setup SSO with your app
-   You can redirect to the Admin Portal from your application with the `akarso` npm package, read how to setup it [here](https://akarso.co)

## How it works

-   The `akarso` npm package lets you create an Admin Portal link where you can redirect your users to setup SSO
-   The Admin Portal will ask your customers for the information needed to integrate SSO with Supabase (metadata, domain, etc)
-   The Admin Portal will redirect the user to the `callbackUrl` with a `token` param, you can use the `akarso` npm package to verify the token and get the SSO provider id and identifier
-   Connect your team database entity with the SSO provider id
-   Now you can use `supabase.auth.signInWithSSO` to sign in your users with SSO

## Security

-   Akarso will generate a `secret` for your Akarso account, Akarso can create Admin Portals only if you have this secret
-   Akarso will redirect to your `callbackUrl` with a jwt `token` in the search params, you can use the `akarso` npm package to verify the token against your `secret` to make sure the request comes from Akarso. The token payload contains the SSO provider id and custom `identifier`

## TODO

-   [ ] support custom domain other than `slug.akarso.site`
-   [ ] add subscription plans to Akarso for customizability and when user has more than 5 SSO connections
-   [ ] support for boxyhq
-   [ ] ability to update the SSO connection metadata if it already exists
-   [ ] add function to delete the SSO connection to `akarso` npm package
