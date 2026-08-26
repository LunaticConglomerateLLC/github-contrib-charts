import { graphql } from '@octokit/graphql';
import type { ChartShapeConfig, ContributionDay, ContributionLevel, DateRange } from './types.js';
import { AuthenticationError, FetchError, NetworkError, RateLimitError, UserNotFoundError } from './errors.js';
import { displayWindow, shapeDayCount } from './grid.js';

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
 * Derives the fetch window for a chart shape, ending at `anchor`
 * (defaults to today UTC midnight). Rectangular covers `days` days,
 * square covers `size²` days.
 *
 * An explicit `override` range is used as-is when its day-span matches
 * the shape window; a mismatching or invalid override throws a RangeError.
 */
export function deriveDateRange(
  config: ChartShapeConfig,
  anchor: Date = new Date(),
  override?: DateRange,
): DateRange {
  if (override !== undefined) {
    const { from, to } = override;
    if (!(from instanceof Date) || !(to instanceof Date) || isNaN(from.getTime()) || isNaN(to.getTime())) {
      throw new RangeError('dateRange.from and dateRange.to must be valid dates');
    }
    if (from > to) throw new RangeError('dateRange.from must be before dateRange.to');
    const expected = shapeDayCount(config);
    const actual = Math.round((to.getTime() - from.getTime()) / 86_400_000);
    if (actual !== expected) {
      throw new RangeError(`dateRange override must cover ${expected} days to match this chart's window`);
    }
    return override;
  }
  return displayWindow(config, anchor);
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
  const fetched = coll.contributionCalendar.weeks.flatMap((week) => week.contributionDays).map((d) => ({
    date: new Date(`${d.date}T00:00:00Z`),
    contributionCount: d.contributionCount,
    contributionLevel: normalizeLevel(d.contributionLevel),
    commitCount: 0,
    pullRequestCount: 0,
    issueCount: 0,
    reviewCount: 0,
  }));

  const byDate = new Map(fetched.map((d) => [d.date.toISOString().slice(0, 10), d]));

  // Normalize to the exact requested window: pad missing dates with empty
  // days and drop anything outside [from, to).
  const days: ContributionDay[] = Array.from({ length: spanDays }, (_, i) => {
    const date = new Date(from.getTime() + i * 86_400_000);
    return byDate.get(date.toISOString().slice(0, 10)) ?? {
      date,
      contributionCount: 0,
      contributionLevel: 'NONE' as ContributionLevel,
      commitCount: 0,
      pullRequestCount: 0,
      issueCount: 0,
      reviewCount: 0,
    };
  });

  // Map aggregate totals to the most-recent day with activity (simplified breakdown).
  let anchorIndex = -1;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i]!.contributionCount > 0) {
      anchorIndex = i;
      break;
    }
  }
  if (anchorIndex === -1 && days.length > 0) anchorIndex = days.length - 1;
  if (anchorIndex >= 0) {
    const anchor = days[anchorIndex]!;
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