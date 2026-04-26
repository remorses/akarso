import { createGroup } from '../globals.ts'
import { createClient } from '../zernio.ts'
import { output } from '../output.ts'
import fsSync from 'node:fs'
import pathModule from 'node:path'

const CONTENT_TYPE_MAP: Record<string, string> = {
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

const media = createGroup()

media
  .command('media upload <file>', 'Upload a media file, returns URL for use in posts')
  .action(async (file, options, { fs, console, process }) => {
    const client = await createClient({
      apiKey: options.apiKey,
      fs,
      env: process.env,
    })

    const ext = pathModule.extname(file).toLowerCase()
    const contentType = CONTENT_TYPE_MAP[ext]
    if (!contentType) {
      console.error(
        `Unsupported file type: ${ext}. Supported: ${Object.keys(CONTENT_TYPE_MAP).join(', ')}`,
      )
      process.exit(1)
    }

    const filename = pathModule.basename(file)
    const stat = fsSync.statSync(file)

    console.error(`Uploading ${filename} (${(stat.size / 1024).toFixed(1)} KB)...`)

    const { data: presign } = await client.media.getMediaPresignedUrl({

      body: {
        filename,
        contentType: contentType as any,
        size: stat.size,
      },
    })


    const fileBuffer = fsSync.readFileSync(file)
    const uploadResp = await fetch(presign!.uploadUrl!, {
      method: 'PUT',
      body: fileBuffer,
      headers: { 'Content-Type': contentType! },
    })

    if (!uploadResp.ok) {
      console.error(`Upload failed: ${uploadResp.status} ${uploadResp.statusText}`)
      process.exit(1)
    }

    console.error('Upload complete.')
    output(
      { publicUrl: presign?.publicUrl, key: presign?.key, type: presign?.type },
      { json: options.json, console },
    )
  })

export default media
