import colors from 'beskar/colors'
import type { Config } from 'tailwindcss'
const { nextui } = require('@nextui-org/react')

const config: Config = {
    content: [
        './src/**/*.{js,ts,jsx,tsx,mdx}',
        '../beskar/src/**/*.{js,ts,jsx,tsx,mdx}',
        './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic':
                    'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
            },
        },
    },

    darkMode: 'class',
    plugins: [
        nextui({
            themes: {
                light: {
                    colors: {
                        primary: {
                            DEFAULT: colors.sky[600],
                            // foreground: '#000000',
                        },
                    },
                },
            },
        }),
    ],
}
export default config
