// Ambient stubs so the CLI can typecheck the website's proxy-api.ts source
// (imported type-only by client.ts for the spiceflow typed fetch client).
// The website's real cloudflare:workers types come from its generated
// worker-configuration.d.ts, which is outside this package's program.
declare module 'cloudflare:workers' {
  const env: any
  const waitUntil: (promise: Promise<any>) => void
  export { env, waitUntil }
}

// Workers Cache API globals used by the website's memoize helper.
declare var caches: any
type Cache = any
