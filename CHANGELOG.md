# akarso

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
