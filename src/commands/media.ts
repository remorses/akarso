// Media upload command plus the shared media input resolver used by every
// command that accepts media (posts create, inbox send). Inputs can be local
// file paths or https URLs; paths are uploaded through the presign flow and
// URLs pass through untouched. On the hosted MCP server (AKARSO_REMOTE_MCP=1)
// local paths are rejected with a pointer to the docs, since there is no
// filesystem with the user's files server-side.
import dedent from 'string-dedent'
import type { GokeFs } from 'goke'
import { createGroup } from '../globals.ts'
import { createClient, type AkarsoClient } from '../client.ts'
import { output } from '../output.ts'
import pathModule from 'node:path'

type MediaContentType = 'image/jpeg' | 'image/jpg' | 'image/png' | 'image/webp' | 'image/gif' | 'video/mp4' | 'video/mpeg' | 'video/quicktime' | 'video/avi' | 'video/x-msvideo' | 'video/webm' | 'video/x-m4v' | 'application/pdf'

/** Media kind used by post mediaItems (image | video | gif | document). */
export type MediaKind = 'image' | 'video' | 'gif' | 'document'

const EXTENSION_MAP: Record<string, { contentType: MediaContentType; kind: MediaKind }> = {
  '.jpg': { contentType: 'image/jpeg', kind: 'image' },
  '.jpeg': { contentType: 'image/jpeg', kind: 'image' },
  '.png': { contentType: 'image/png', kind: 'image' },
  '.webp': { contentType: 'image/webp', kind: 'image' },
  '.gif': { contentType: 'image/gif', kind: 'gif' },
  '.mp4': { contentType: 'video/mp4', kind: 'video' },
  '.mov': { contentType: 'video/quicktime', kind: 'video' },
  '.avi': { contentType: 'video/avi', kind: 'video' },
  '.webm': { contentType: 'video/webm', kind: 'video' },
  '.pdf': { contentType: 'application/pdf', kind: 'document' },
}

const SUPPORTED_EXTENSIONS = Object.keys(EXTENSION_MAP).join(', ')

export interface MediaInputInfo {
  kind: 'url' | 'path'
  /** Best-effort media kind from the extension. URLs without a recognized
   *  extension default to image; local paths require a known extension. */
  mediaKind: MediaKind
  contentType?: MediaContentType
  filename: string
}

/** Classify a media input as URL or local path and infer its media type
 *  from the extension. Pure function, no I/O. */
export function classifyMediaInput(input: string): MediaInputInfo | Error {
  const isUrl = /^https?:\/\//i.test(input)
  const pathname = isUrl ? new URL(input).pathname : input
  const ext = pathModule.extname(pathname).toLowerCase()
  const known = EXTENSION_MAP[ext]
  const filename = pathModule.basename(pathname) || `file${ext}`

  if (!known && !isUrl) {
    return new Error(
      `Unsupported file type "${ext || input}". Supported extensions: ${SUPPORTED_EXTENSIONS}`,
    )
  }
  return {
    kind: isUrl ? 'url' : 'path',
    // URLs without a recognized extension (CDN links, signed URLs) default
    // to image, matching the upstream API's most common case.
    mediaKind: known?.kind ?? 'image',
    contentType: known?.contentType,
    filename,
  }
}

/** Error message for local paths on the hosted multi-tenant MCP server. */
function remotePathError(input: string): Error {
  return new Error(dedent`
    Local file paths are not supported on the hosted MCP server: "${input}".

    The server cannot read files from your machine. Either:
      - pass a publicly accessible https:// URL instead, or
      - run the MCP server locally with the Akarso CLI (\`akarso mcp\`), which can read local files.

    Read more: https://akarso.co/docs/mcp
  `)
}

/** Upload a local file or remote URL through the presign flow and return the
 *  hosted public URL. Used by `media upload`, `posts create`, `inbox send`. */
export async function uploadMedia(opts: {
  input: string
  client: AkarsoClient
  fs: GokeFs
  env: Record<string, string | undefined>
  /** stderr logger (progress messages must not pollute stdout) */
  log: (message: string) => void
}): Promise<{ publicUrl: string; key?: string; type?: string; mediaKind: MediaKind }> {
  const info = classifyMediaInput(opts.input)
  if (info instanceof Error) throw info

  // Uint8Array<ArrayBuffer> (not ArrayBufferLike) so the bytes satisfy
  // fetch BodyInit under Cloudflare Workers types too.
  let bytes: Uint8Array<ArrayBuffer>
  let contentType: MediaContentType

  if (info.kind === 'url') {
    opts.log(`Downloading ${opts.input}...`)
    const response = await fetch(opts.input)
    if (!response.ok) {
      throw new Error(`Failed to download ${opts.input}: ${response.status} ${response.statusText}`)
    }
    bytes = new Uint8Array(await response.arrayBuffer())
    const headerType = response.headers.get('content-type')?.split(';')[0]?.trim()
    // Narrow the response header to a supported content type without assertions
    const headerContentType = Object.values(EXTENSION_MAP).find(
      (entry) => entry.contentType === headerType,
    )?.contentType
    const resolved = info.contentType ?? headerContentType
    if (!resolved) {
      throw new Error(
        `Cannot determine content type for ${opts.input}. Use a URL with a file extension (${SUPPORTED_EXTENSIONS}).`,
      )
    }
    contentType = resolved
  } else {
    if (opts.env.AKARSO_REMOTE_MCP) throw remotePathError(opts.input)
    if (!info.contentType) {
      throw new Error(
        `Unsupported file type for "${opts.input}". Supported extensions: ${SUPPORTED_EXTENSIONS}`,
      )
    }
    contentType = info.contentType
    const data = await opts.fs.readFile(opts.input)
    // Uint8Array.from copies into a fresh ArrayBuffer-backed array. Both Buffer
    // and @types/node's TextEncoder.encode are typed Uint8Array<ArrayBufferLike>,
    // which is not assignable to the Uint8Array<ArrayBuffer> fetch body type.
    const raw = typeof data === 'string' ? new TextEncoder().encode(data) : data
    bytes = Uint8Array.from(raw)
  }

  opts.log(`Uploading ${info.filename} (${(bytes.byteLength / 1024).toFixed(1)} KB)...`)

  const presign = await opts.client('/api/v1/media/upload', {
    method: 'POST',
    body: {
      filename: info.filename,
      contentType,
      size: bytes.byteLength,
    },
  })
  if (presign instanceof Error) throw presign
  if (!presign.uploadUrl || !presign.publicUrl) {
    throw new Error('Upload failed: no upload URL returned.')
  }

  const uploadResp = await fetch(presign.uploadUrl, {
    method: 'PUT',
    body: bytes,
    headers: { 'Content-Type': contentType },
  })
  if (!uploadResp.ok) {
    throw new Error(`Upload failed: ${uploadResp.status} ${uploadResp.statusText}`)
  }

  opts.log('Upload complete.')
  return {
    publicUrl: presign.publicUrl,
    key: presign.key,
    type: presign.type,
    mediaKind: info.mediaKind,
  }
}

/** Resolve a media input to a publicly reachable URL: https URLs pass
 *  through untouched, local paths are uploaded first. */
export async function resolveMediaInput(opts: {
  input: string
  client: AkarsoClient
  fs: GokeFs
  env: Record<string, string | undefined>
  log: (message: string) => void
}): Promise<{ url: string; mediaKind: MediaKind }> {
  const info = classifyMediaInput(opts.input)
  if (info instanceof Error) throw info
  if (info.kind === 'url') {
    return { url: opts.input, mediaKind: info.mediaKind }
  }
  if (opts.env.AKARSO_REMOTE_MCP) throw remotePathError(opts.input)
  const uploaded = await uploadMedia(opts)
  return { url: uploaded.publicUrl, mediaKind: uploaded.mediaKind }
}

const media = createGroup()

media
  .command(
    'media upload <fileOrUrl>',
    'Upload media from a local file path or `https` URL, returns a hosted URL for use in posts',
  )
  .example('akarso media upload ./photo.jpg')
  .example('akarso media upload https://example.com/video.mp4')
  .action(async (fileOrUrl, options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const result = await uploadMedia({
      input: fileOrUrl,
      client,
      fs,
      env: process.env,
      log: (message) => console.error(message),
    })
    output(
      { publicUrl: result.publicUrl, key: result.key, type: result.type },
      { json: options.json, console },
    )
  })

export default media
