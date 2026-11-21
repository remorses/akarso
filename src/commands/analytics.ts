// Analytics commands: account-level metrics of the workspace's connected
// accounts. Each call counts as one analytics request (requires an active
// subscription). Accounts are addressed by platform name; the server
// resolves the workspace's account.
import { z } from 'zod'
import dedent from 'string-dedent'
import { createGroup, toApiPlatform } from '../globals.ts'
import { createClient } from '../client.ts'
import { exitOnApiError, output } from '../output.ts'

const analytics = createGroup()

analytics
  .command(
    'analytics followers <platform>',
    dedent`
      Get the current follower (or subscriber) count of a connected account.

      Supported: \`facebook\`, \`instagram\`, \`linkedin\` (company pages only), \`youtube\`, \`pinterest\`, \`bluesky\`. \`followers\` is null when the platform does not report it.

      **Requires an active subscription.** Counts as one analytics request.
    `,
  )
  .example('akarso analytics followers instagram')
  .action(async (platformArg, options, { fs, console, process }) => {
    const platform = z.enum(['facebook', 'instagram', 'linkedin', 'youtube', 'pinterest', 'bluesky']).parse(platformArg)
    const client = await createClient({ apiKey: options.apiKey, fs, env: process.env })
    const data = await client('/api/v2/analytics/followers', { query: { platform: toApiPlatform(platform) } })
    if (data instanceof Error) exitOnApiError({ error: data, console, process })
    output(data, { json: options.json, console })
  })

analytics
  .command(
    'analytics instagram-insights',
    dedent`
      Get account-wide insights of the connected Instagram account.

      Covers feed, Stories, Explore, and profile activity. The range defaults to the last 30 days and cannot exceed 90. Metrics Instagram does not return are omitted.

      **Requires an active subscription.** Counts as one analytics request.
    `,
  )
  .example('akarso analytics instagram-insights --metrics reach,views,profile_views --since 2026-10-01')
  .option(
    '--metrics [list]',
    z
      .string()
      .describe('Comma-separated metrics: reach, views, accounts_engaged, total_interactions, comments, likes, saves, shares, replies, reposts, follows_and_unfollows, profile_links_taps, profile_views'),
  )
  .option('--since [date]', z.string().describe('Start date, YYYY-MM-DD (default 30 days ago)'))
  .option('--until [date]', z.string().describe('End date, YYYY-MM-DD (default today)'))
  .option('--daily', 'Return daily values (time series, reach only)')
  .option(
    '--breakdown [dimension]',
    z
      .enum(['media_product_type', 'follow_type', 'follower_type', 'contact_button_type'])
      .optional()
      .describe('Split totals by a dimension (not with --daily)'),
  )
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({ apiKey: options.apiKey, fs, env: process.env })
    const data = await client('/api/v2/analytics/instagram/insights', {
      query: {
        metrics: options.metrics || undefined,
        since: options.since || undefined,
        until: options.until || undefined,
        metricType: options.daily ? 'time_series' : undefined,
        breakdown: options.breakdown || undefined,
      },
    })
    if (data instanceof Error) exitOnApiError({ error: data, console, process })
    output(data, { json: options.json, console })
  })

analytics
  .command(
    'analytics instagram-demographics',
    dedent`
      Get audience demographics of the connected Instagram account by age, city, country, and gender.

      Needs a large enough audience; data can lag up to 48 hours. **Requires an active subscription.** Counts as one analytics request.
    `,
  )
  .option(
    '--audience [audience]',
    z.enum(['followers', 'engaged', 'reached']).optional().describe('Whose demographics: followers (default), engaged, or reached accounts'),
  )
  .option('--breakdown [list]', z.string().describe('Comma-separated dimensions: age, city, country, gender (default all)'))
  .option(
    '--timeframe [timeframe]',
    z.enum(['this_week', 'this_month']).optional().describe('Last 7 or 30 days (default this_month)'),
  )
  .action(async (options, { fs, console, process }) => {
    const metrics = {
      followers: 'follower_demographics',
      engaged: 'engaged_audience_demographics',
      reached: 'reached_audience_demographics',
    } as const
    const client = await createClient({ apiKey: options.apiKey, fs, env: process.env })
    const data = await client('/api/v2/analytics/instagram/demographics', {
      query: {
        metric: options.audience ? metrics[options.audience] : undefined,
        breakdown: options.breakdown || undefined,
        timeframe: options.timeframe || undefined,
      },
    })
    if (data instanceof Error) exitOnApiError({ error: data, console, process })
    output(data, { json: options.json, console })
  })

analytics
  .command(
    'analytics googlebusiness-performance',
    dedent`
      Get location performance of the connected Google Business Profile.

      Website clicks, calls, direction requests, messages, bookings, and impressions split by Search/Maps and desktop/mobile. Google offers no per-post metrics. **Requires an active subscription.** Counts as one analytics request.
    `,
  )
  .option('--days [n]', z.number().optional().describe('Trailing window in days, 1-540 (default 28)'))
  .option('--daily', 'Include a per-day series')
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({ apiKey: options.apiKey, fs, env: process.env })
    const data = await client('/api/v2/analytics/googlebusiness/performance', {
      query: { days: options.days, daily: options.daily || undefined },
    })
    if (data instanceof Error) exitOnApiError({ error: data, console, process })
    output(data, { json: options.json, console })
  })

analytics
  .command(
    'analytics googlebusiness-keywords',
    dedent`
      List the search terms people used to find the connected Google Business Profile, with impressions.

      Covers completed months only (the current month is not available yet). **Requires an active subscription.** Counts as one analytics request.
    `,
  )
  .option('--months [n]', z.number().optional().describe('Completed months to include, 1-18 (default 1)'))
  .action(async (options, { fs, console, process }) => {
    const client = await createClient({ apiKey: options.apiKey, fs, env: process.env })
    const data = await client('/api/v2/analytics/googlebusiness/keywords', {
      query: { months: options.months },
    })
    if (data instanceof Error) exitOnApiError({ error: data, console, process })
    output(data, { json: options.json, console })
  })

export default analytics
