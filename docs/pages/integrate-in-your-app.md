<script setup>

import redirectJsCode from 'website/src/snippets/redirect.raw.js?raw'
import callbackJsCode from 'website/src/snippets/callback.raw.js?raw'
import loginCode from 'website/src/snippets/login.raw.js?raw'
import { useData } from 'vitepress'

</script>

# Integrating Akarso in your website

You can integrate Akarso in your website adding a button to your dashboard and redirecting to the Akarso Admin Portal when the user clicks the button.

## Install the akarso npm package

```js-vue
npm i akarso
```

## Redirect the customer to the Akarso Admin Portal

When the user wants to connect SSO, redirect him to the Akarso Admin Portal

```js-vue
{{ redirectJsCode }}
```

## Customer gets redirected to `callbackUrl`

In your callback page, connect the SSO provider to your team entity

```js-vue
{{ callbackJsCode }}
```

## Login

Users can now sign in with SSO

```js-vue
{{ loginCode }}
```

You can see a full example application written in Next.js [here](https://github.com/remorses/akarso/blob/62bedda2347bfc387a0c4846c6a41ea8e6aba7af/website/src/pages/api/functions.ts#L113)
