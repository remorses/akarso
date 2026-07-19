// Tests the scheduling input parser and post body builder used by the
// posts command.
import { describe, expect, test } from 'vitest';
import { parseScheduledAt } from "../scheduling.js";
import { buildPostBody } from "./posts.js";
const now = new Date('2026-04-27T12:00:00.000Z');
describe('parseScheduledAt', () => {
    test('keeps ISO input as normalized ISO', () => {
        expect(parseScheduledAt('2026-04-27T12:30:00Z', now)).toMatchInlineSnapshot(`"2026-04-27T12:30:00.000Z"`);
    });
    test('parses compact relative times', () => {
        expect([
            parseScheduledAt('30m', now),
            parseScheduledAt('2h', now),
            parseScheduledAt('3d', now),
            parseScheduledAt('1w', now),
        ]).toMatchInlineSnapshot(`
      [
        "2026-04-27T12:30:00.000Z",
        "2026-04-27T14:00:00.000Z",
        "2026-04-30T12:00:00.000Z",
        "2026-05-04T12:00:00.000Z",
      ]
    `);
    });
    test('rejects invalid and past inputs', () => {
        expect(() => parseScheduledAt('tomorrow', now)).toThrowErrorMatchingInlineSnapshot(`[Error: Invalid scheduled time. Use an ISO date or a relative value like 30m, 2h, 3d, or 1w.]`);
        expect(() => parseScheduledAt('2026-04-27T11:59:00Z', now)).toThrowErrorMatchingInlineSnapshot(`[Error: Scheduled time must be in the future.]`);
    });
});
describe('buildPostBody', () => {
    test('publish now schedules at the current time', () => {
        expect(buildPostBody({ text: 'Hello!', platforms: ['twitter', 'linkedin'], publishNow: true, now })).toMatchInlineSnapshot(`
      {
        "data": {
          "LINKEDIN": {
            "text": "Hello!",
          },
          "TWITTER": {
            "text": "Hello!",
          },
        },
        "postDate": "2026-04-27T12:00:00.000Z",
        "socialAccountTypes": [
          "TWITTER",
          "LINKEDIN",
        ],
        "status": "SCHEDULED",
        "title": "Hello!",
      }
    `);
    });
    test('scheduled-at parses relative times and applies media to every platform', () => {
        expect(buildPostBody({
            text: 'Later',
            platforms: ['googlebusiness'],
            scheduledAt: '2h',
            uploadIds: ['upl_1', 'upl_2'],
            now,
        })).toMatchInlineSnapshot(`
      {
        "data": {
          "GOOGLE_BUSINESS": {
            "text": "Later",
            "uploadIds": [
              "upl_1",
              "upl_2",
            ],
          },
        },
        "postDate": "2026-04-27T14:00:00.000Z",
        "socialAccountTypes": [
          "GOOGLE_BUSINESS",
        ],
        "status": "SCHEDULED",
        "title": "Later",
      }
    `);
    });
    test('no timing flags saves a draft with a custom title', () => {
        expect(buildPostBody({ text: 'Draft text', title: 'My title', platforms: ['tiktok'], now })).toMatchInlineSnapshot(`
      {
        "data": {
          "TIKTOK": {
            "text": "Draft text",
          },
        },
        "postDate": "2026-04-27T12:00:00.000Z",
        "socialAccountTypes": [
          "TIKTOK",
        ],
        "status": "DRAFT",
        "title": "My title",
      }
    `);
    });
});
