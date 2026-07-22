<div align='center' class='hidden'>
    <br/>
    <br/>
    <h3>akarso</h3>
    <p>Post and schedule across 10 social platforms from the terminal.</p>
    <br/>
    <br/>
</div>

```sh
npm install -g akarso
akarso auth login
akarso posts create --text "Hello world!" --platforms x
```

[Docs](https://akarso.co/docs/getting-started/quickstart) · [Dashboard](https://akarso.co/dashboard) · [npm](https://www.npmjs.com/package/akarso)

## Features

- **10 platforms**: X, Instagram, LinkedIn, Facebook, TikTok, YouTube, Threads, Pinterest, Bluesky, Google Business
- **Schedule posts** with relative shortcuts (`2h`, `3d`, `1w`) or ISO timestamps
- **Multi-platform**: one command posts to multiple platforms at once
- **Media**: attach local files or public URLs (jpg, png, webp, gif, mp4, mov)
- **Drafts**: save posts for free, publish or schedule them later
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

Opens OAuth in the browser. Any page or channel selection (Facebook Pages, LinkedIn organizations, YouTube channels) happens inside the OAuth flow itself.

You can connect accounts before subscribing. Publishing requires a subscription.

### 3. Post

```sh
akarso posts create \
  --text "Hello from Akarso!" \
  --platforms x
```

Pass `--scheduled-at 2h` to schedule, or `--draft` to save without publishing.

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
| `posts reschedule <id>` | Move a scheduled post to a new time |
| `posts cancel <id>` | Cancel a scheduled post |
| `drafts list` | List saved drafts |
| `drafts publish <id>` | Publish or schedule a saved draft |

```sh
# Post to multiple platforms with media
akarso posts create \
  --text "Check this out!" \
  --platforms x,linkedin,instagram \
  --media ./photo.jpg

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
| `accounts get <platform>` | Account details |
| `accounts disconnect <platform>` | Disconnect a platform |
| `accounts pinterest-boards` | List Pinterest board IDs for `--pinterest-board` |

### Profiles (workspaces)

| Command | Description |
|---------|-------------|
| `profiles list` | List org profiles |
| `profiles create --name <name>` | Create a new workspace |

API keys are pinned to one profile. Override per-command with `--profile <id>`.

### Media

```sh
akarso media upload ./video.mp4
```

Uploads the file and returns a public URL. `posts create --media` accepts local paths and https URLs directly, so a separate upload step is rarely needed.

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

| Platform | CLI name |
|----------|----------|
| X / Twitter | `x` |
| Instagram | `instagram` |
| LinkedIn | `linkedin` |
| Facebook | `facebook` |
| TikTok | `tiktok` |
| YouTube | `youtube` |
| Threads | `threads` |
| Pinterest | `pinterest` (requires `--pinterest-board`) |
| Bluesky | `bluesky` (connects via app password) |
| Google Business | `googlebusiness` |

## Agent Skill

This package ships a skill file that teaches AI coding agents how and when to use it. Install it with:

```bash
npx -y skills add https://akarso.co
```

## License

MIT
