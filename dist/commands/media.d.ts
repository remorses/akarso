import type { GokeFs } from 'goke';
import { type AkarsoClient } from '../client.ts';
type MediaContentType = 'image/jpeg' | 'image/jpg' | 'image/png' | 'image/webp' | 'image/gif' | 'video/mp4' | 'video/mpeg' | 'video/quicktime' | 'video/avi' | 'video/x-msvideo' | 'video/webm' | 'video/x-m4v' | 'application/pdf';
export interface MediaInputInfo {
    kind: 'url' | 'path';
    contentType?: MediaContentType;
    filename: string;
}
/** Classify a media input as URL or local path and infer its content type
 *  from the extension. Pure function, no I/O. */
export declare function classifyMediaInput(input: string): MediaInputInfo | Error;
export interface UploadedMedia {
    /** Upload ID for use in post `data.<PLATFORM>.uploadIds`. */
    id: string;
    url?: string | null;
    type?: string;
}
/** Upload a local file (raw bytes through the proxy) or import a remote
 *  URL (server-side), returning the upload record. */
export declare function uploadMedia(opts: {
    input: string;
    client: AkarsoClient;
    apiKey?: string;
    fs: GokeFs;
    env: Record<string, string | undefined>;
    /** stderr logger (progress messages must not pollute stdout) */
    log: (message: string) => void;
}): Promise<UploadedMedia>;
/** Resolve a media input (local path or https URL) to an upload ID for
 *  use in post `data.<PLATFORM>.uploadIds`. */
export declare function resolveMediaToUploadId(opts: {
    input: string;
    client: AkarsoClient;
    apiKey?: string;
    fs: GokeFs;
    env: Record<string, string | undefined>;
    log: (message: string) => void;
}): Promise<string>;
declare const media: import("goke").Goke<{
    apiKey?: string | undefined;
} & {
    apiUrl?: string | undefined;
} & {
    profile?: string | undefined;
} & {
    json?: boolean | undefined;
}>;
export default media;
//# sourceMappingURL=media.d.ts.map