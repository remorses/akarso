<div align='center' class='hidden'>
    <br/>
    <br/>
    <h3>akarso</h3>
    <p>Post, schedule, and reply across 14 social platforms from the terminal.</p>
    <br/>
    <br/>
</div>

```sh
npm install -g akarso
akarso auth login
akarso posts create --text "Hello world!" --platforms x --publish-now
```

[Docs](https://akarso.co/docs/getting-started/quickstart) · [Dashboard](https://akarso.co/dashboard) · [npm](https://www.npmjs.com/package/akarso)

## Features

- **14 platforms**: X, Instagram, LinkedIn, Facebook, TikTok, YouTube, Threads, Reddit, Pinterest, Bluesky, Mastodon, Discord, Slack, Google Business
- **Schedule posts** with relative shortcuts (`2h`, `3d`, `1w`) or ISO timestamps
- **Multi-platform**: one command posts to multiple platforms at once
- **Media uploads**: attach local files or URLs, up to ~90 MB
- **Comments and reviews**: import, reply, and moderate across platforms
- **MCP server**: every CLI command is an MCP tool for AI agents
- **YAML output**: pipe through `yq`; use `--json` for JSON

## Quickstart

### 1. Install and log in

```sh
npm install -g akarso
akarso auth login
```

Opens your browser for Google sign-in. An API key is saved automatically.

```sh
akarso auth check   # verify it works
```

### 2. Connect a social account

```sh
akarso accounts connect x
```

Opens OAuth in the browser. Some platforms (Facebook, Instagram, LinkedIn, YouTube, Google Business) also need a publishing target selected; the flow shows the picker automatically.

Connecting accounts is **free** for up to 3 channels.

### 3. Post

```sh
akarso posts create \
  --text "Hello from Akarso!" \
  --platforms x \
  --publish-now
```

Pass `--scheduled-at 2h` to schedule, or omit both flags to save a draft.

## Commands

All commands use **space-separated subcommands** (`akarso auth login`, not `auth:login`).

### Auth

| Command | Description |
|---------|-------------|
| `auth login` | Browser OAuth login |
| `auth set --key <key>` | Manually save an API key |
| `auth check` | Verify your key is valid |
| `auth logout` | Remove saved credentials |

### Posts

| Command | Description |
|---------|-------------|
| `posts create` | Create, schedule, or publish a post |
| `posts list` | List posts (filter by `--status`, `--platforms`) |
| `posts get <id>` | Get post details |
| `posts delete <id>` | Delete a post |
| `posts retry <id>` | Retry a failed post |

```sh
# Post to multiple platforms with media
akarso posts create \
  --text "Check this out!" \
  --platforms x,linkedin,instagram \
  --media ./photo.jpg \
  --publish-now

# Schedule for 2 hours from now
akarso posts create \
  --text "Coming soon" \
  --platforms x \
  --scheduled-at 2h
```

### Accounts

| Command | Description |
|---------|-------------|
| `accounts connect [platform]` | Browser OAuth connect |
| `accounts list` | List connected social accounts |
| `accounts get <platform>` | Account details and selectable channels |
| `accounts health` | Check connection health |
| `accounts set-channel <platform> --channel-id <id>` | Pick publishing target |
| `accounts disconnect <platform>` | Disconnect a platform |

### Profiles (workspaces)

| Command | Description |
|---------|-------------|
| `profiles list` | List org profiles |
| `profiles create --name <name>` | Create a new workspace |

API keys are pinned to one profile. Override per-command with `--profile <id>`.

### Media

```sh
akarso media upload ./video.mp4
akarso media upload https://cdn.example.com/image.jpg
```

Returns an upload ID for use with `posts create --media`.

### Inbox

```sh
akarso inbox sync <postId> --platform instagram   # import comments
akarso inbox comments --post-id <postId>           # list imported comments
akarso inbox reply <postId> --platform instagram --text "Thanks!"
akarso inbox comment-action <commentId> --action HIDE

# Google Business reviews
akarso inbox reviews-sync --count 50
akarso inbox reviews
akarso inbox review-reply <reviewId> --text "Thank you for your review!"
```

## Global options

| Option | Description |
|--------|-------------|
| `--api-key <key>` | Override API key |
| `--profile <id>` | Override the key's pinned profile |
| `--json` | Output raw JSON instead of YAML |
| `--api-url <url>` | Custom API base URL |

API key resolution: `--api-key` flag > `AKARSO_API_KEY` env > `~/.akarso/config.json`.

## MCP server

Every CLI command is available as an MCP tool for AI agents.

### Remote (zero install)

```
https://akarso.co/mcp
```

Add this URL to Claude, Cursor, ChatGPT, or any MCP client. First request triggers OAuth sign-in.

```sh
# Claude Code
claude mcp add --transport http akarso https://akarso.co/mcp
```

For headless/CI environments, send an API key header instead:

```json
{
  "mcpServers": {
    "akarso": {
      "type": "http",
      "url": "https://akarso.co/mcp",
      "headers": { "Authorization": "Bearer ak_your_key_here" }
    }
  }
}
```

### Local stdio

```sh
akarso mcp
```

Uses your local `akarso auth login` credentials. Supports local file uploads that the remote server can't do.

```sh
npx @playwriter/install-mcp 'akarso mcp' --client claude-code
npx @playwriter/install-mcp 'akarso mcp' --client cursor
```

## Supported platforms

| Platform | CLI name | Posting | Scheduling | Comments | Reviews |
|----------|----------|---------|------------|----------|---------|
| X / Twitter | `x` | Yes | Yes | - | - |
| Instagram | `instagram` | Yes | Yes | Yes | - |
| LinkedIn | `linkedin` | Yes | Yes | Yes | - |
| Facebook | `facebook` | Yes | Yes | Yes | - |
| TikTok | `tiktok` | Yes | Yes | Yes | - |
| YouTube | `youtube` | Yes | Yes | Yes | - |
| Threads | `threads` | Yes | Yes | Yes | - |
| Reddit | `reddit` | Yes | Yes | Yes | - |
| Pinterest | `pinterest` | Yes | Yes | - | - |
| Bluesky | `bluesky` | Yes | Yes | Yes | - |
| Mastodon | `mastodon` | Yes | Yes | Yes | - |
| Discord | `discord` | Yes | Yes | - | - |
| Slack | `slack` | Yes | Yes | - | - |
| Google Business | `googlebusiness` | Yes | Yes | - | Yes |

## Agent Skill

This package ships a skill file that teaches AI coding agents how and when to use it. Install it with:

```bash
npx -y skills add https://akarso.co
```

## License

MIT
