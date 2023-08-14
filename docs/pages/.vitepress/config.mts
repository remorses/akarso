import { defineConfig } from 'vitepress'
import {} from 'vitepress/client'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: 'Akarso Docs',
    description:
        'Documentation for akarso.co, learn how to implement SSO sign-up in 10 lines of code',
    lang: 'en-US',
    base: '/docs',
    themeConfig: {
        search: {
            provider: 'local',
        },
        logoLink: 'https://akarso.co',

        // logo: './img/logo.svg',
        // https://vitepress.dev/reference/default-theme-config
        // nav: [
        //     { text: 'Home', link: '/' },
        //     { text: 'Examples', link: '/markdown-examples' },
        // ],

        sidebar: [
            {
                text: 'Admin Portal',
                items: [
                    {
                        text: 'Integrate in your App',
                        link: '/integrate-in-your-app',
                    },
                    {
                        text: 'Generate an Admin Portal URL without code',
                        link: '/nocode-admin-panel',
                    },
                ],
            },
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/vuejs/vitepress' },
        ],
    },
})
