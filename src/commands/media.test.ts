// Tests the pure media input classifier: URL vs path detection and media
// type inference from extensions. The effectful upload path is covered by
// the e2e MCP validation script (website/scripts/mcp-oauth-test.ts).
import { describe, expect, test } from 'vitest'
import { classifyMediaInput } from './media.ts'

describe('classifyMediaInput', () => {
  test('local paths with known extensions', () => {
    const inputs = ['./photo.jpg', '/tmp/clip.MOV', 'animation.gif', 'video.mp4']
    const results = inputs.map((input) => ({ input, ...classifyMediaInput(input) }))
    expect(results).toMatchInlineSnapshot(`
      [
        {
          "contentType": "image/jpeg",
          "filename": "photo.jpg",
          "input": "./photo.jpg",
          "kind": "path",
          "mediaType": "image",
        },
        {
          "contentType": "video/quicktime",
          "filename": "clip.MOV",
          "input": "/tmp/clip.MOV",
          "kind": "path",
          "mediaType": "video",
        },
        {
          "contentType": "image/gif",
          "filename": "animation.gif",
          "input": "animation.gif",
          "kind": "path",
          "mediaType": "gif",
        },
        {
          "contentType": "video/mp4",
          "filename": "video.mp4",
          "input": "video.mp4",
          "kind": "path",
          "mediaType": "video",
        },
      ]
    `)
  })

  test('https URLs with and without extensions', () => {
    expect(classifyMediaInput('https://example.com/clip.mp4')).toMatchInlineSnapshot(`
      {
        "contentType": "video/mp4",
        "filename": "clip.mp4",
        "kind": "url",
        "mediaType": "video",
      }
    `)
    // URL without a recognized extension is rejected: the post body must
    // declare image vs video vs gif, and guessing wrong breaks publishing.
    const ambiguous = classifyMediaInput('https://cdn.example.com/abc123?sig=xyz')
    if (!(ambiguous instanceof Error)) throw new Error('expected an Error result')
    expect(ambiguous.message).toContain('no recognized file extension')
  })

  test('local paths with unsupported extensions are errors', () => {
    for (const input of ['notes.txt', 'docs/deck.pdf', 'video.webm']) {
      const result = classifyMediaInput(input)
      if (!(result instanceof Error)) throw new Error(`expected an Error result for ${input}`)
      expect(result.message).toContain('Unsupported file type')
    }
  })
})
