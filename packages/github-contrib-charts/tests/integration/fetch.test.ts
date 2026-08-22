import { describe, it, expect, vi, beforeEach } from 'vitest';
import { graphql } from '@octokit/graphql';
import { fetchContributions } from '../../src/fetch.js';
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

    expect(result).toHaveLength(2);
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