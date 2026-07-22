// Media upload command plus the shared media input resolver used by every
// command that accepts media (posts create). Media is URL-based: post
// bodies reference public URLs directly. https URLs pass straight through;
// local file paths are uploaded via a presigned URL from the proxy (the
// bytes go directly to storage, then the returned public URL goes into the
// post body). On the hosted MCP server (AKARSO_REMOTE_MCP=1) local paths
// are rejected with a pointer to the docs, since there is no filesystem
// with the user's files server-side.
import dedent from 'string-dedent'
import type { GokeFs } from 'goke'
import { createGroup } from '../globals.ts'
import { createClient, type AkarsoClient } from '../client.ts'
import { output } from '../output.ts'
import pathModule from 'node:path'

type MediaContentType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/gif'
  | 'video/mp4'
  | 'video/quicktime'

const EXTENSION_MAP: Record<string, MediaContentType> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
}

const SUPPORTED_EXTENSIONS = Object.keys(EXTENSION_MAP).join(', ')

export type MediaKind = 'image' | 'video' | 'gif'

export interface MediaInputInfo {
  kind: 'url' | 'path'
  contentType: MediaContentType
  filename: string
  /** Media kind for the post body, inferred from the extension. */
  mediaType: MediaKind
}

function mediaTypeForContentType(contentType: MediaContentType): MediaKind {
  if (contentType === 'image/gif') return 'gif'
  if (contentType.startsWith('video/')) return 'video'
  return 'image'
}

/** Classify a media input as URL or local path and infer its content type
 *  from the extension. Pure function, no I/O. URLs without a recognized
 *  extension are rejected: the post body must declare image vs video vs
 *  gif, and guessing wrong breaks publishing. */
export function classifyMediaInput(input: string): MediaInputInfo | Error {
  const isUrl = /^https?:\/\//i.test(input)
  const pathname = isUrl ? new URL(input).pathname : input
  const ext = pathModule.extname(pathname).toLowerCase()
  const contentType = EXTENSION_MAP[ext]
  const filename = pathModule.basename(pathname) || `file${ext}`

  if (!contentType) {
    return isUrl
      ? new Error(
          `Cannot infer the media type of "${input}" — its URL has no recognized file extension (${SUPPORTED_EXTENSIONS}). Use a URL ending in one of those extensions, or download the file and pass the local path.`,
        )
      : new Error(
          `Unsupported file type "${ext || input}". Supported extensions: ${SUPPORTED_EXTENSIONS}`,
        )
  }
  return {
    kind: isUrl ? 'url' : 'path',
    contentType,
    filename,
    mediaType: mediaTypeForContentType(contentType),
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

/** Media attachment for a post body. The index signature matches the
 *  server schema (a loose object that passes unknown fields through). */
export interface MediaItem {
  type: MediaKind
  url: string
  [key: string]: unknown
}

/** Resolve a media input to a post-body media item. https URLs pass
 *  through unchanged; local files upload via a presigned URL (the bytes
 *  go straight to storage, never through the proxy). */
export async function resolveMediaItem(opts: {
  input: string
  client: AkarsoClient
  fs: GokeFs
  env: Record<string, string | undefined>
  /** stderr logger (progress messages must not pollute stdout) */
  log: (message: string) => void
}): Promise<MediaItem> {
  const info = classifyMediaInput(opts.input)
  if (info instanceof Error) throw info

  if (info.kind === 'url') {
    return { type: info.mediaType, url: opts.input }
  }

  if (opts.env.AKARSO_REMOTE_MCP) throw remotePathError(opts.input)
  const data = await opts.fs.readFile(opts.input)
  // Uint8Array.from copies into a fresh ArrayBuffer-backed array. Both Buffer
  // and @types/node's TextEncoder.encode are typed Uint8Array<ArrayBufferLike>,
  // which is not assignable to the Uint8Array<ArrayBuffer> fetch body type.
  const raw = typeof data === 'string' ? new TextEncoder().encode(data) : data
  const bytes = Uint8Array.from(raw)

  opts.log(`Uploading ${info.filename} (${(bytes.byteLength / 1024).toFixed(1)} KB)...`)

  const presigned = await opts.client('/api/v2/media/upload', {
    method: 'POST',
    body: { filename: info.filename, mimeType: info.contentType },
  })
  if (presigned instanceof Error) throw presigned

  // PUT the raw bytes directly to storage. The Content-Type header must
  // match the mimeType the presigned URL was created with.
  const response = await fetch(presigned.data.uploadUrl, {
    method: 'PUT',
    body: bytes,
    headers: { 'Content-Type': info.contentType },
  })
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
  }
  opts.log('Upload complete.')
  return { type: info.mediaType, url: presigned.data.publicUrl }
}

/** Resolve a comma-separated --media value to post-body media items. */
export async function resolveMediaItems(opts: {
  inputs: string
  client: AkarsoClient
  fs: GokeFs
  env: Record<string, string | undefined>
  log: (message: string) => void
}): Promise<MediaItem[]> {
  const items: MediaItem[] = []
  for (const input of opts.inputs.split(',').map((value) => value.trim()).filter(Boolean)) {
    items.push(await resolveMediaItem({ ...opts, input }))
  }
  return items
}

const media = createGroup()

media
  .command(
    'media upload <fileOrUrl>',
    dedent`
      Upload a local media file, returning a public URL for use with \`posts create --media\`.

      The file is uploaded directly to storage via a presigned URL. Supported formats: jpg, jpeg, png, webp, gif, mp4, mov.

      Files already hosted at a public \`https\` URL don't need uploading — pass the URL straight to \`posts create --media\`. You can also pass local file paths directly to \`posts create --media\` without a separate upload step; they are uploaded automatically.

      **Limitation:** on the hosted MCP server, local file paths are not available. Use \`https\` URLs instead, or run Akarso locally with \`akarso mcp\` to access local files.
    `,
  )
  .example('akarso media upload ./photo.jpg')
  .example('akarso posts create --text "Pic" --platforms x --media https://example.com/photo.jpg')
  .action(async (fileOrUrl, options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })
    const result = await resolveMediaItem({
      input: fileOrUrl,
      client,
      fs,
      env: process.env,
      log: (message) => console.error(message),
    })
    output(result, { json: options.json, console })
  })

export default media
