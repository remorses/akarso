import { type Platform } from '../globals.ts';
/** Build the create-post request body. Content is per-platform under
 *  `data.<PLATFORM>`; the CLI applies the same text and media to every
 *  selected platform. Pure function so the CLI action and tests share the
 *  rules:
 *  - publish now  → status SCHEDULED with postDate = now
 *  - scheduled-at → status SCHEDULED with the parsed postDate
 *  - neither      → status DRAFT (postDate still required upstream) */
export declare function buildPostBody(opts: {
    text: string;
    title?: string;
    platforms: Platform[];
    uploadIds?: string[];
    publishNow?: boolean;
    scheduledAt?: string;
    now?: Date;
}): {
    title: string;
    postDate: string;
    status: "DRAFT" | "SCHEDULED";
    socialAccountTypes: ("TIKTOK" | "YOUTUBE" | "INSTAGRAM" | "FACEBOOK" | "TWITTER" | "THREADS" | "LINKEDIN" | "PINTEREST" | "REDDIT" | "MASTODON" | "DISCORD" | "SLACK" | "BLUESKY" | "GOOGLE_BUSINESS")[];
    data: {
        [k: string]: {
            uploadIds?: string[] | undefined;
            text: string;
        };
    };
};
declare const posts: import("goke").Goke<{
    apiKey?: string | undefined;
} & {
    apiUrl?: string | undefined;
} & {
    profile?: string | undefined;
} & {
    json?: boolean | undefined;
}>;
export default posts;
//# sourceMappingURL=posts.d.ts.map