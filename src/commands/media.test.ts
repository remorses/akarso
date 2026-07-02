// Tests the pure media input classifier: URL vs path detection and media
// type inference from extensions. The effectful upload path is covered by
// the e2e MCP validation script (website/scripts/mcp-oauth-test.ts).
import { describe, expect, test } from 'vitest'
import { classifyMediaInput } from './media.ts'

describe('classifyMediaInput', () => {
  test('local paths with known extensions', () => {
    const inputs = ['./photo.jpg', '/tmp/clip.MOV', 'animation.gif', 'docs/deck.pdf', 'video.webm']
    const results = inputs.map((input) => ({ input, ...classifyMediaInput(input) }))
    expect(results).toMatchInlineSnapshot(`
      [
        {
          "contentType": "image/jpeg",
          "filename": "photo.jpg",
          "input": "./photo.jpg",
          "kind": "path",
          "mediaKind": "image",
        },
        {
          "contentType": "video/quicktime",
          "filename": "clip.MOV",
          "input": "/tmp/clip.MOV",
          "kind": "path",
          "mediaKind": "video",
        },
        {
          "contentType": "image/gif",
          "filename": "animation.gif",
          "input": "animation.gif",
          "kind": "path",
          "mediaKind": "gif",
        },
        {
          "contentType": "application/pdf",
          "filename": "deck.pdf",
          "input": "docs/deck.pdf",
          "kind": "path",
          "mediaKind": "document",
        },
        {
          "contentType": "video/webm",
          "filename": "video.webm",
          "input": "video.webm",
          "kind": "path",
          "mediaKind": "video",
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
        "mediaKind": "video",
      }
    `)
    // URL without recognized extension defaults to image
    expect(classifyMediaInput('https://cdn.example.com/abc123?sig=xyz')).toMatchInlineSnapshot(`
      {
        "contentType": undefined,
        "filename": "abc123",
        "kind": "url",
        "mediaKind": "image",
      }
    `)
  })

  test('local path with unknown extension is an error', () => {
    const result = classifyMediaInput('notes.txt')
    if (!(result instanceof Error)) throw new Error('expected an Error result')
    expect(result.message).toContain('Unsupported file type')
  })
})
