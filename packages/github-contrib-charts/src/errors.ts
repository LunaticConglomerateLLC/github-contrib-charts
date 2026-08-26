import type { ChartShapeConfig } from './types.js';
import { DEFAULT_DAYS, DEFAULT_SIZE, MAX_DAYS, MAX_SIZE, MIN_DAYS, MIN_SIZE } from './types.js';

/** Base error for all contribution chart fetch errors. */
export class FetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FetchError';
  }
}

/** Token was invalid or expired. */
export class AuthenticationError extends FetchError {
  constructor(message = 'Authentication failed: token is invalid or expired.') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/** The requested GitHub user does not exist. */
export class UserNotFoundError extends FetchError {
  constructor(username: string) {
    super(`User not found: ${username}`);
    this.name = 'UserNotFoundError';
  }
}

/** GitHub GraphQL rate limit exceeded. */
export class RateLimitError extends FetchError {
  /** Timestamp (ms since epoch) when the rate limit resets. */
  resetAt: Date;

  constructor(resetAt: Date, message = 'GitHub API rate limit exceeded.') {
    super(message);
    this.name = 'RateLimitError';
    this.resetAt = resetAt;
  }
}

/** Network failure or timeout while reaching GitHub. */
export class NetworkError extends FetchError {
  constructor(message = 'Failed to reach GitHub. Check your network connection.') {
    super(message);
    this.name = 'NetworkError';
  }
}

/** Validates a rectangular day count, throwing a RangeError when out of bounds. */
export function validateDays(days: number): void {
  if (!Number.isInteger(days) || days < MIN_DAYS || days > MAX_DAYS) {
    throw new RangeError(`days must be an integer between ${MIN_DAYS} and ${MAX_DAYS}`);
  }
}

/** Validates a square edge size, throwing a RangeError when out of bounds. */
export function validateSize(size: number): void {
  if (!Number.isInteger(size) || size < MIN_SIZE || size > MAX_SIZE) {
    throw new RangeError(`size must be an integer between ${MIN_SIZE} and ${MAX_SIZE}`);
  }
}

/**
 * Validates a chart shape config, throwing a RangeError for unknown shapes or
 * out-of-bounds dimensions.
 */
export function validateChartShapeConfig(config: ChartShapeConfig): void {
  if ('shape' in config) {
    if (config.shape === 'rectangular') {
      validateDays(config.days ?? DEFAULT_DAYS);
      return;
    }
    if (config.shape === 'square') {
      validateSize(config.size ?? DEFAULT_SIZE);
      return;
    }
    throw new RangeError("shape must be 'rectangular' or 'square'");
  }
}