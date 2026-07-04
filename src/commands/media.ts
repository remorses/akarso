// Media upload command plus the shared media input resolver used by every
// command that accepts media (posts create). Inputs can be local file paths
// or https URLs; paths are uploaded as raw bytes through the proxy, URLs are
// imported server-side — both produce an upload ID referenced by posts via
// `data.<PLATFORM>.uploadIds`. On the hosted MCP server (AKARSO_REMOTE_MCP=1)
// local paths are rejected with a pointer to the docs, since there is no
// filesystem with the user's files server-side.
import dedent from 'string-dedent'
import type { GokeFs } from 'goke'
import { createGroup } from '../globals.ts'
import { createClient, resolveApiKey, resolveBaseUrl, type AkarsoClient } from '../client.ts'
import { output } from '../output.ts'
import pathModule from 'node:path'

type MediaContentType = 'image/jpeg' | 'image/jpg' | 'image/png' | 'image/webp' | 'image/gif' | 'video/mp4' | 'video/mpeg' | 'video/quicktime' | 'video/avi' | 'video/x-msvideo' | 'video/webm' | 'video/x-m4v' | 'application/pdf'

const EXTENSION_MAP: Record<string, MediaContentType> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.avi': 'video/avi',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
}

const SUPPORTED_EXTENSIONS = Object.keys(EXTENSION_MAP).join(', ')

export interface MediaInputInfo {
  kind: 'url' | 'path'
  contentType?: MediaContentType
  filename: string
}

/** Classify a media input as URL or local path and infer its content type
 *  from the extension. Pure function, no I/O. */
export function classifyMediaInput(input: string): MediaInputInfo | Error {
  const isUrl = /^https?:\/\//i.test(input)
  const pathname = isUrl ? new URL(input).pathname : input
  const ext = pathModule.extname(pathname).toLowerCase()
  const contentType = EXTENSION_MAP[ext]
  const filename = pathModule.basename(pathname) || `file${ext}`

  if (!contentType && !isUrl) {
    return new Error(
      `Unsupported file type "${ext || input}". Supported extensions: ${SUPPORTED_EXTENSIONS}`,
    )
  }
  return { kind: isUrl ? 'url' : 'path', contentType, filename }
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

export interface UploadedMedia {
  /** Upload ID for use in post `data.<PLATFORM>.uploadIds`. */
  id: string
  url?: string | null
  type?: string
}

/** Upload a local file (raw bytes through the proxy) or import a remote
 *  URL (server-side), returning the upload record. */
export async function uploadMedia(opts: {
  input: string
  client: AkarsoClient
  apiKey?: string
  fs: GokeFs
  env: Record<string, string | undefined>
  /** stderr logger (progress messages must not pollute stdout) */
  log: (message: string) => void
}): Promise<UploadedMedia> {
  const info = classifyMediaInput(opts.input)
  if (info instanceof Error) throw info

  if (info.kind === 'url') {
    opts.log(`Importing ${opts.input}...`)
    const data = await opts.client('/api/v1/media/from-url', {
      method: 'POST',
      body: { url: opts.input },
    })
    if (data instanceof Error) throw data
    opts.log('Import complete.')
    return { id: data.id, url: data.url, type: data.type }
  }

  if (opts.env.AKARSO_REMOTE_MCP) throw remotePathError(opts.input)
  if (!info.contentType) {
    throw new Error(
      `Unsupported file type for "${opts.input}". Supported extensions: ${SUPPORTED_EXTENSIONS}`,
    )
  }
  const data = await opts.fs.readFile(opts.input)
  // Uint8Array.from copies into a fresh ArrayBuffer-backed array. Both Buffer
  // and @types/node's TextEncoder.encode are typed Uint8Array<ArrayBufferLike>,
  // which is not assignable to the Uint8Array<ArrayBuffer> fetch body type.
  const raw = typeof data === 'string' ? new TextEncoder().encode(data) : data
  const bytes = Uint8Array.from(raw)

  opts.log(`Uploading ${info.filename} (${(bytes.byteLength / 1024).toFixed(1)} KB)...`)

  // Raw-bytes upload: the typed client only speaks JSON, so this one call
  // uses plain fetch against the same proxy route.
  const apiKey = await resolveApiKey({ apiKey: opts.apiKey, fs: opts.fs, env: opts.env })
  if (!apiKey) {
    throw new Error('No API key found. Run `akarso auth login` or `akarso auth set --key <key>` first.')
  }
  const url = new URL('/api/v1/media/upload', resolveBaseUrl(opts.env))
  url.searchParams.set('filename', info.filename)
  const response = await fetch(url, {
    method: 'POST',
    body: bytes,
    headers: {
      'Content-Type': info.contentType,
      ...(apiKey.startsWith('ak_')
        ? { 'x-api-key': apiKey }
        : { Authorization: `Bearer ${apiKey}` }),
      ...(opts.env.AKARSO_PROFILE_ID
        ? { 'x-akarso-profile-id': opts.env.AKARSO_PROFILE_ID }
        : undefined),
    },
  })
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
  }
  const upload = (await response.json()) as UploadedMedia
  opts.log('Upload complete.')
  return upload
}

/** Resolve a media input (local path or https URL) to an upload ID for
 *  use in post `data.<PLATFORM>.uploadIds`. */
export async function resolveMediaToUploadId(opts: {
  input: string
  client: AkarsoClient
  apiKey?: string
  fs: GokeFs
  env: Record<string, string | undefined>
  log: (message: string) => void
}): Promise<string> {
  const uploaded = await uploadMedia(opts)
  return uploaded.id
}

const media = createGroup()

media
  .command(
    'media upload <fileOrUrl>',
    dedent`
      Upload a media file or import a URL, returning an upload ID for use with \`posts create --media\`.

      **Two input modes:**
      - **Local file path:** the file is read from disk and uploaded as raw bytes through the proxy. Supported formats: jpg, png, webp, gif, mp4, mov, avi, webm, pdf.
      - **https URL:** the URL is passed to the server which imports the media remotely. Any file type the server supports is accepted.

      The returned \`id\` can be passed to \`posts create --media\` to attach the upload to a post. You can also pass file paths and URLs directly to \`posts create --media\` without a separate upload step; they are resolved automatically.

      **Limitation:** on the hosted MCP server, local file paths are not available. Use \`https\` URLs instead, or run Akarso locally with \`akarso mcp\` to access local files.
    `,
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
      apiKey: options.apiKey,
      fs,
      env: process.env,
      log: (message) => console.error(message),
    })
    output(
      { id: result.id, url: result.url, type: result.type },
      { json: options.json, console },
    )
  })

export default media
