import { describe, it, expect, vi, beforeEach } from 'vitest';
import { graphql } from '@octokit/graphql';
import { fetchContributions, deriveDateRange } from '../../src/fetch.js';
import { AuthenticationError, UserNotFoundError, RateLimitError, NetworkError, FetchError } from '../../src/errors.js';

vi.mock('@octokit/graphql', () => ({
  graphql: vi.fn(),
}));

const mockedGraphql = vi.mocked(graphql);

const DATE_RANGE = { from: new Date('2026-01-01T00:00:00Z'), to: new Date('2026-01-08T00:00:00Z') };

function validResponse() {
  return {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          weeks: [
            {
              contributionDays: [
                { date: '2026-01-01', contributionCount: 1, contributionLevel: 'FIRST_QUARTILE' },
                { date: '2026-01-02', contributionCount: 3, contributionLevel: 'SECOND_QUARTILE' },
              ],
            },
          ],
        },
        totalCommitContributions: 2,
        totalPullRequestContributions: 1,
        totalIssueContributions: 1,
        totalPullRequestReviewContributions: 1,
      },
    },
  };
}

beforeEach(() => {
  mockedGraphql.mockReset();
});

describe('fetchContributions', () => {
  it('fetches and normalizes contribution data', async () => {
    mockedGraphql.mockResolvedValue(validResponse() as never);

    const result = await fetchContributions('token', 'octocat', DATE_RANGE);

    expect(result).toHaveLength(7); // exact window: Jan1..Jan7
    expect(result[0]!.date.toISOString().slice(0, 10)).toBe('2026-01-01');
    expect(result[0]!.contributionCount).toBe(1);
    expect(result[0]!.contributionLevel).toBe('FIRST_QUARTILE');
    expect(result[1]!.commitCount).toBe(2); // totalCommitContributions mapped to day? See impl
  });

  it('throws RangeError when date range exceeds 366 days', async () => {
    await expect(
      fetchContributions('t', 'u', { from: new Date('2026-01-01'), to: new Date('2027-01-03') }),
    ).rejects.toThrow(RangeError);
    expect(mockedGraphql).not.toHaveBeenCalled();
  });

  it('throws AuthenticationError on invalid token', async () => {
    mockedGraphql.mockRejectedValue(new Error('Bad credentials'));
    await expect(fetchContributions('bad', 'octocat', DATE_RANGE)).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('throws UserNotFoundError when user does not exist', async () => {
    mockedGraphql.mockRejectedValue({ message: 'Could not resolve to a User with the login of "nope"' });
    await expect(fetchContributions('t', 'nope', DATE_RANGE)).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('throws RateLimitError with resetAt when rate limited', async () => {
    mockedGraphql.mockRejectedValue({ message: 'rate limit', data: { rateLimit: { resetAt: '2026-01-01T10:00:00Z' } } });
    const err = await fetchContributions('t', 'octocat', DATE_RANGE).catch((e) => e);
    expect(err).toBeInstanceOf(RateLimitError);
    expect((err as RateLimitError).resetAt).toEqual(new Date('2026-01-01T10:00:00Z'));
  });

  it('throws NetworkError on network failure', async () => {
    mockedGraphql.mockRejectedValue(new TypeError('fetch failed'));
    await expect(fetchContributions('t', 'octocat', DATE_RANGE)).rejects.toBeInstanceOf(NetworkError);
  });

  it('wraps unknown errors as FetchError', async () => {
    mockedGraphql.mockRejectedValue(new Error('something else'));
    await expect(fetchContributions('t', 'octocat', DATE_RANGE)).rejects.toBeInstanceOf(FetchError);
  });

  it('throws RangeError when dates are invalid', async () => {
    await expect(
      fetchContributions('t', 'u', { from: new Date('invalid'), to: DATE_RANGE.to }),
    ).rejects.toThrow(RangeError);
    expect(mockedGraphql).not.toHaveBeenCalled();
  });

  it('throws RangeError when from is after to', async () => {
    await expect(
      fetchContributions('t', 'u', { from: new Date('2026-02-01'), to: new Date('2026-01-01') }),
    ).rejects.toThrow(RangeError);
    expect(mockedGraphql).not.toHaveBeenCalled();
  });

  it('normalizes an unrecognized contributionLevel to NONE', async () => {
    const resp = validResponse();
    resp.user.contributionsCollection.contributionCalendar.weeks[0]!.contributionDays[0]!.contributionLevel = 'UNKNOWN';
    mockedGraphql.mockResolvedValue(resp as never);
    const result = await fetchContributions('t', 'octocat', DATE_RANGE);
    expect(result[0]!.contributionLevel).toBe('NONE');
  });

  it('throws FetchError when the response shape is unexpected', async () => {
    mockedGraphql.mockResolvedValue({ user: null } as never);
    await expect(fetchContributions('t', 'octocat', DATE_RANGE)).rejects.toBeInstanceOf(FetchError);
  });
});

describe('deriveDateRange', () => {
  const anchor = new Date('2024-01-06T00:00:00Z'); // Saturday
  const iso = (d: Date): string => d.toISOString().slice(0, 10);

  it('rectangular days=30 → 30-day window ending at anchor', () => {
    const range = deriveDateRange({ shape: 'rectangular', days: 30 }, anchor);
    expect(iso(range.from)).toBe('2023-12-08');
    expect(iso(range.to)).toBe('2024-01-07');
  });

  it('rectangular defaults to 365 days', () => {
    const range = deriveDateRange({ shape: 'rectangular' }, anchor);
    expect(Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000)).toBe(365);
  });

  it('square size=10 → 100-day window ending at anchor', () => {
    const range = deriveDateRange({ shape: 'square', size: 10 }, anchor);
    expect(iso(range.from)).toBe('2023-09-29');
    expect(iso(range.to)).toBe('2024-01-07');
  });

  it('defaults the anchor to today UTC midnight', () => {
    const range = deriveDateRange({ shape: 'square', size: 1 });
    const today = new Date();
    const utcToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    expect(range.from.getTime()).toBe(utcToday.getTime());
  });

  it('honors an explicit dateRange override with a matching day-span', () => {
    const override = { from: new Date('2023-12-31T00:00:00Z'), to: new Date('2024-01-07T00:00:00Z') };
    const range = deriveDateRange({ shape: 'rectangular', days: 7 }, anchor, override);
    expect(range).toBe(override);
  });

  it('honors a matching override for square windows', () => {
    const override = { from: new Date('2024-01-03T00:00:00Z'), to: new Date('2024-01-07T00:00:00Z') };
    const range = deriveDateRange({ shape: 'square', size: 2 }, anchor, override);
    expect(range).toBe(override);
  });

  it('rejects an override whose day-span mismatches the shape window', () => {
    const override = { from: new Date('2023-12-15T00:00:00Z'), to: new Date('2024-01-07T00:00:00Z') };
    expect(() =>
      deriveDateRange({ shape: 'rectangular', days: 30 }, anchor, override),
    ).toThrow(/must cover 30 days/);
    expect(() => deriveDateRange({ shape: 'square', size: 10 }, anchor, override)).toThrow(RangeError);
  });

  it('rejects an override with invalid dates', () => {
    const override = { from: new Date('not-a-date'), to: new Date('2024-01-07T00:00:00Z') };
    expect(() =>
      deriveDateRange({ shape: 'rectangular', days: 7 }, anchor, override),
    ).toThrow(RangeError);
  });
});

describe('fetchContributions window normalization', () => {
  beforeEach(() => {
    mockedGraphql.mockReset();
  });

  it('pads missing dates and filters days outside the exact window', async () => {
    mockedGraphql.mockResolvedValue(validResponse() as never);
    // Window Jan1..Jan8 exclusive → exactly 7 days; mock only returns 2.
    const result = await fetchContributions('token', 'octocat', DATE_RANGE);

    expect(result).toHaveLength(7);
    expect(result[0]!.date.toISOString().slice(0, 10)).toBe('2026-01-01');
    expect(result[0]!.contributionCount).toBe(1);
    expect(result[6]!.date.toISOString().slice(0, 10)).toBe('2026-01-07');
    expect(result[6]!.contributionCount).toBe(0);
    expect(result[6]!.contributionLevel).toBe('NONE');
  });
});
describe('fetchContributions aggregate mapping', () => {
  it('maps aggregate totals to the most recent day with activity', async () => {
    mockedGraphql.mockResolvedValueOnce({
      user: {
        contributionsCollection: {
          contributionCalendar: {
            weeks: [
              {
                contributionDays: [
                  { date: '2026-01-01', contributionCount: 0, contributionLevel: 'NONE' },
                  { date: '2026-01-02', contributionCount: 3, contributionLevel: 'FIRST_QUARTILE' },
                  { date: '2026-01-03', contributionCount: 0, contributionLevel: 'NONE' },
                ],
              },
            ],
          },
          totalCommitContributions: 7,
          totalPullRequestContributions: 2,
          totalIssueContributions: 1,
          totalPullRequestReviewContributions: 4,
        },
      },
    });
    const days = await fetchContributions('tok', 'octocat', DATE_RANGE);
    const active = days.find((d) => d.contributionCount > 0)!;
    expect(active.commitCount).toBe(7);
    expect(active.pullRequestCount).toBe(2);
    expect(active.issueCount).toBe(1);
    expect(active.reviewCount).toBe(4);
    expect(days[days.length - 1]!.commitCount).toBe(0);
  });
});
