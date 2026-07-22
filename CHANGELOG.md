# akarso

## 0.3.0

1. **Posts publish immediately by default** — `posts create` with no timing flag now publishes right away. The `--publish-now` flag is gone; use `--draft` to save without publishing or `--scheduled-at` to schedule:

   ```bash
   # Publish now
   akarso posts create --text "Hello!" --platforms x

   # Schedule for later (ISO date or 30m / 2h / 3d / 1w)
   akarso posts create --text "Later" --platforms x,linkedin --scheduled-at 2h

   # Save as a draft
   akarso posts create --text "Idea" --platforms x --draft
   ```

   `--scheduled-at` now requires a value; a bare flag errors instead of silently saving a draft.

2. **New `drafts` commands** — drafts are stored by Akarso, are free, and don't require a subscription. Billing applies only when you publish:

   ```bash
   akarso drafts list
   akarso drafts get <draftId>
   akarso drafts publish <draftId>                    # publish now
   akarso drafts publish <draftId> --scheduled-at 2h  # or schedule
   akarso drafts delete <draftId>
   ```

   Account resolution is deferred until publish time, so drafts survive account reconnects.

3. **New `posts reschedule` and `posts cancel` commands** — manage scheduled posts without deleting them:

   ```bash
   akarso posts reschedule <postId> --scheduled-at 2026-03-15T14:00:00Z
   akarso posts cancel <postId>
   ```

   `posts delete` gained `--delete-from-platforms` to also remove the published post from the social platforms. `posts retry` was removed.

4. **New `posts list` filters** — date ranges and lowercase statuses:

   ```bash
   akarso posts list --status scheduled
   akarso posts list --created-after 2026-07-01T00:00:00Z
   akarso posts list --scheduled-after 2026-07-01T00:00:00Z --scheduled-before 2026-08-01T00:00:00Z
   ```

   Statuses are now lowercase: `draft`, `pending`, `scheduled`, `publishing`, `published`, `failed`, `partial`. The old `postDateFrom`/`postDateTo` and text search filters were replaced by `--created-after`/`--created-before` and `--scheduled-after`/`--scheduled-before`.

5. **Pinterest support** — new `accounts pinterest-boards` command lists your board IDs, and `posts create --pinterest-board <id>` targets a board (required when posting to pinterest):

   ```bash
   akarso accounts pinterest-boards
   akarso posts create --text "Pin this" --platforms pinterest --pinterest-board 1234567890
   ```

6. **Platforms trimmed from 14 to 10** — reddit, mastodon, discord, and slack were dropped. Supported: `twitter` (alias `x`), `instagram`, `facebook`, `linkedin`, `tiktok`, `youtube`, `threads`, `pinterest`, `bluesky`, `googlebusiness`. Platform names are lowercase everywhere.

7. **Simpler account management** — `accounts get <platform>` and `accounts disconnect <platform>` address accounts by platform name. `accounts set-channel` and `accounts health` were removed; page/channel selection now happens inside the hosted OAuth flow when you connect.

8. **Media handling reworked** — `posts create --media` accepts local paths and `https` URLs, comma-separated. URLs are referenced directly; local files upload via presigned URLs. Supported formats: jpg, png, webp, gif, mp4, mov (pdf/webm/avi are no longer accepted). URLs without a recognized extension are rejected instead of guessing the media type.

9. **Inbox commands removed** — the comments/reviews inbox feature was discontinued.

10. **Fixed onboarding rough edges** — the `auth login` success message now shows the correct `--platforms` flag, and `akarso subscribe` opens the subscription page directly instead of the dashboard home.

## 0.2.0

1. **New `--profile` global flag** — override the API key's pinned profile on any command, letting one key operate on multiple workspaces:

   ```bash
   # List available profiles
   akarso profiles list

   # Post from a specific profile
   akarso posts create --text "Hello!" --platforms x --publish-now --profile 01JXYZ...

   # List accounts in a different profile
   akarso accounts list --profile 01JXYZ...
   ```

   Also settable via the `AKARSO_PROFILE_ID` env var. The profile must belong to the same org as the API key.

2. **New `profiles rename` command** — rename a workspace from the CLI:

   ```bash
   akarso profiles rename 01JXYZ... --name "Client Acme"
   ```

3. **Simplified pricing** — plans consolidated from 3 tiers to 2 (Hobby $29/mo, Business $199/mo). Plan references in help text and command descriptions updated to match.

4. **Fixed inbox CLI examples** — `inbox sync` and `inbox reply` examples now use supported platforms (`instagram`, `youtube`) instead of `x`, which doesn't support comment import

5. **Added README** with quickstart, full command reference, MCP server setup, and platform support matrix

6. **Bumped spiceflow** to `1.26.0-rsc.8`

## 0.1.0

First public release of the Akarso CLI. Post, schedule, and moderate across 14 social platforms from the terminal.

1. **Full social media management from the CLI** — create, schedule, and publish posts to twitter (aliased as `x`), instagram, facebook, linkedin, tiktok, youtube, threads, reddit, pinterest, bluesky, googlebusiness, mastodon, discord, and slack:

   ```bash
   akarso posts create --text "Hello world" --platforms x,linkedin --publish-now
   akarso posts create --text "Later" --platforms instagram --scheduled-at 2h
   ```

2. **Browser-based device flow auth** — `akarso auth login` prints a code and opens the browser; once approved the API key is saved automatically. Also supports `akarso auth set --key ak_xxx` for CI and headless environments

3. **OAuth account connection** — `akarso accounts connect <platform>` opens the browser for OAuth. Channel selection for multi-target platforms (Facebook Pages, LinkedIn orgs, YouTube channels, Google Business locations) via `akarso accounts set-channel`

4. **Media uploads** — attach local files or https URLs to posts with `--media`. Files are uploaded through the proxy; URLs are imported server-side. Standalone upload with `akarso media upload <fileOrUrl>` returns an ID for later use

5. **Inbox: comment import and moderation** — async comment import with `akarso inbox sync`, reply to comments and post threads with `inbox reply`, moderate with `inbox comment-action` (DELETE, HIDE, UNHIDE, LIKE, UNLIKE, APPROVE, REJECT). Google Business review import and reply with `inbox reviews-sync` and `inbox review-reply`

6. **Multi-profile workspaces** — `akarso profiles list` and `profiles create` to manage isolated workspaces within an org, each with its own accounts and posts

7. **MCP server** — `akarso mcp` starts a local stdio MCP server exposing all commands as typed tools for AI agents (Claude, Cursor, etc.). Remote hosted MCP also available at `akarso.co/mcp`

8. **Flexible scheduling syntax** — `--scheduled-at` accepts ISO 8601 timestamps or relative shortcuts: `30m`, `2h`, `3d`, `1w`

9. **YAML output by default** — all structured data goes to stdout as YAML (pipeable through `yq`). Pass `--json` for raw JSON output. Progress and errors go to stderr

10. **Shell completions** — `akarso completions install` for zsh and bash auto-complete

11. **SDK exports** — `createClient`, `resolveApiKey`, `resolveBaseUrl`, and config helpers are exported for programmatic use from Node.js/TypeScript
