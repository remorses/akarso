import { test } from 'vitest'
import { randomHash } from 'website/src/lib/ssr-edge'

test('randomHash', async () => {
    const hash = await randomHash()
    console.log(hash)
})
