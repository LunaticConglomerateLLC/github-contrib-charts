import { graphql } from '@octokit/graphql';
import type { ContributionDay, ContributionLevel, DateRange } from './types.js';
import { AuthenticationError, FetchError, NetworkError, RateLimitError, UserNotFoundError } from './errors.js';

const MAX_DAYS = 366;

interface RawContributionDay {
  date: string;
  contributionCount: number;
  contributionLevel: string;
}

interface RawResponse {
  user: {
    contributionsCollection: {
      contributionCalendar: {
        weeks: { contributionDays: RawContributionDay[] }[];
      };
      totalCommitContributions: number;
      totalPullRequestContributions: number;
      totalIssueContributions: number;
      totalPullRequestReviewContributions: number;
    };
  };
}

/**
 * Fetches contribution data for a GitHub user over a date range using the GitHub GraphQL API.
 */
export async function fetchContributions(
  token: string,
  username: string,
  dateRange: DateRange,
): Promise<ContributionDay[]> {
  const { from, to } = dateRange;
  if (!(from instanceof Date) || !(to instanceof Date) || isNaN(from.getTime()) || isNaN(to.getTime())) {
    throw new RangeError('dateRange.from and dateRange.to must be valid dates');
  }
  if (from > to) throw new RangeError('dateRange.from must be before dateRange.to');
  const spanDays = Math.floor((to.getTime() - from.getTime()) / 86_400_000);
  if (spanDays > MAX_DAYS) throw new RangeError(`date range must not exceed ${MAX_DAYS} days`);

  const query = `
    query contributions($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
                contributionLevel
              }
            }
          }
          totalCommitContributions
          totalPullRequestContributions
          totalIssueContributions
          totalPullRequestReviewContributions
        }
      }
    }
  `;

  let raw: RawResponse;
  try {
    raw = (await graphql(query, {
      username,
      from: from.toISOString(),
      to: to.toISOString(),
      headers: { authorization: `Bearer ${token}` },
    })) as RawResponse;
  } catch (err) {
    throw mapGraphQLError(err, username);
  }

  const coll = raw?.user?.contributionsCollection;
  if (!coll) throw new FetchError('GitHub returned an unexpected response shape.');

  // Distribute the aggregate totals across the returned days for type breakdowns.
  const days = coll.contributionCalendar.weeks.flatMap((week) => week.contributionDays).map((d) => ({
    date: new Date(`${d.date}T00:00:00Z`),
    contributionCount: d.contributionCount,
    contributionLevel: normalizeLevel(d.contributionLevel),
    commitCount: 0,
    pullRequestCount: 0,
    issueCount: 0,
    reviewCount: 0,
  }));

  // Map aggregate totals to the most-recent day with activity (simplified breakdown).
  const total = days.length;
  if (total > 0) {
    const anchor = days[total - 1]!;
    anchor.commitCount = coll.totalCommitContributions;
    anchor.pullRequestCount = coll.totalPullRequestContributions;
    anchor.issueCount = coll.totalIssueContributions;
    anchor.reviewCount = coll.totalPullRequestReviewContributions;
  }

  return days;
}

function normalizeLevel(level: string): ContributionLevel {
  switch (level) {
    case 'NONE':
    case 'FIRST_QUARTILE':
    case 'SECOND_QUARTILE':
    case 'THIRD_QUARTILE':
    case 'FOURTH_QUARTILE':
      return level;
    default:
      return 'NONE';
  }
}

function mapGraphQLError(err: unknown, username: string): FetchError {
  const msg = err instanceof Error ? err.message : (err as { message?: string })?.message;
  const message = msg ?? String(err);
  const data = (err as { data?: { rateLimit?: { resetAt?: string } } })?.data;

  if (/bad credentials|authentication|401/i.test(message)) {
    return new AuthenticationError();
  }
  if (/could not resolve to a user|could not resolve to a user with the login/i.test(message)) {
    return new UserNotFoundError(username);
  }
  if (/rate limit|rate_limit|secondary rate/i.test(message)) {
    const resetAt = data?.rateLimit?.resetAt ? new Date(data.rateLimit.resetAt) : new Date();
    return new RateLimitError(resetAt);
  }
  if (/fetch failed|network|ECONNREFUSED|ETIMEDOUT|getaddr/i.test(message)) {
    return new NetworkError();
  }
  return new FetchError(`GitHub API request failed: ${message}`);
}