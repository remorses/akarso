import { z } from 'zod';
declare const platformValues: readonly ["facebook", "instagram", "linkedin", "x", "twitter", "tiktok", "youtube", "threads", "reddit", "pinterest", "bluesky", "googlebusiness", "mastodon", "discord", "slack"];
export type Platform = (typeof platformValues)[number];
/** API platform type for a CLI platform name (x/twitter → TWITTER,
 *  googlebusiness → GOOGLE_BUSINESS). */
export declare function toApiPlatform(platform: string): "TIKTOK" | "YOUTUBE" | "INSTAGRAM" | "FACEBOOK" | "TWITTER" | "THREADS" | "LINKEDIN" | "PINTEREST" | "REDDIT" | "MASTODON" | "DISCORD" | "SLACK" | "BLUESKY" | "GOOGLE_BUSINESS";
export declare const platforms: {
    schema: z.ZodEnum<{
        discord: "discord";
        facebook: "facebook";
        slack: "slack";
        twitter: "twitter";
        linkedin: "linkedin";
        tiktok: "tiktok";
        reddit: "reddit";
        x: "x";
        instagram: "instagram";
        youtube: "youtube";
        threads: "threads";
        pinterest: "pinterest";
        bluesky: "bluesky";
        googlebusiness: "googlebusiness";
        mastodon: "mastodon";
    }>;
    commentsSchema: z.ZodEnum<{
        facebook: "facebook";
        linkedin: "linkedin";
        tiktok: "tiktok";
        reddit: "reddit";
        instagram: "instagram";
        youtube: "youtube";
        threads: "threads";
        bluesky: "bluesky";
        mastodon: "mastodon";
    }>;
    commentRepliesSchema: z.ZodEnum<{
        discord: "discord";
        facebook: "facebook";
        slack: "slack";
        linkedin: "linkedin";
        tiktok: "tiktok";
        reddit: "reddit";
        instagram: "instagram";
        youtube: "youtube";
        threads: "threads";
        bluesky: "bluesky";
        mastodon: "mastodon";
    }>;
    channelSelectSchema: z.ZodEnum<{
        facebook: "facebook";
        linkedin: "linkedin";
        instagram: "instagram";
        youtube: "youtube";
        googlebusiness: "googlebusiness";
    }>;
    options: ({
        value: "x";
        label: string;
    } | {
        value: "twitter";
        label: string;
    } | {
        value: "instagram";
        label: string;
    } | {
        value: "linkedin";
        label: string;
    } | {
        value: "facebook";
        label: string;
    } | {
        value: "tiktok";
        label: string;
    } | {
        value: "youtube";
        label: string;
    } | {
        value: "threads";
        label: string;
    } | {
        value: "reddit";
        label: string;
    } | {
        value: "pinterest";
        label: string;
    } | {
        value: "bluesky";
        label: string;
    } | {
        value: "googlebusiness";
        label: string;
    } | {
        value: "mastodon";
        label: string;
    } | {
        value: "discord";
        label: string;
    } | {
        value: "slack";
        label: string;
    })[];
};
/** Create a goke instance with the shared global options (--api-key, --api-url, --json, --profile) */
export declare function createGroup(): import("goke").Goke<{
    apiKey?: string | undefined;
} & {
    apiUrl?: string | undefined;
} & {
    profile?: string | undefined;
} & {
    json?: boolean | undefined;
}>;
export {};
//# sourceMappingURL=globals.d.ts.map