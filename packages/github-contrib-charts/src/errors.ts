import type { ChartShapeConfig } from './types.js';
import {
  DEFAULT_COLUMNS,
  DEFAULT_DAYS,
  DEFAULT_ROWS,
  MAX_DAYS,
  MIN_COLUMNS,
  MIN_DAYS,
  MIN_ROWS,
} from './types.js';

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

/**
 * Validates a custom rectangular row count (integer ≥ 1), throwing a
 * RangeError that names the offending parameter.
 */
export function validateRows(rows: number): void {
  if (!Number.isInteger(rows) || rows < MIN_ROWS || rows > MAX_DAYS) {
    throw new RangeError(`rows must be an integer between ${MIN_ROWS} and ${MAX_DAYS}`);
  }
}

/**
 * Validates a custom rectangular column count (integer ≥ 1), throwing a
 * RangeError that names the offending parameter.
 */
export function validateColumns(columns: number): void {
  if (!Number.isInteger(columns) || columns < MIN_COLUMNS || columns > MAX_DAYS) {
    throw new RangeError(`columns must be an integer between ${MIN_COLUMNS} and ${MAX_DAYS}`);
  }
}

/**
 * Validates the combined custom rectangular window, throwing a RangeError
 * when `rows × columns` exceeds the 366-day maximum.
 */
export function validateRectangularDimensions(rows: number, columns: number): void {
  if (rows * columns > MAX_DAYS) {
    throw new RangeError(`rows * columns must not exceed ${MAX_DAYS} days`);
  }
}

/** Error message for combining `days` with explicit rows/columns. */
const DAYS_CONFLICT_MESSAGE = "'days' cannot be combined with 'rows'/'columns'; use one or the other";

/** Square mode removed per FR-017. */
const SQUARE_REMOVED_MESSAGE =
  "square mode removed: use { shape: 'rectangular', rows: N, columns: N } (e.g. rows: 7, columns: 7 for 7×7)";

/**
 * Validates a chart shape config, throwing a RangeError for unknown shapes,
 * out-of-bounds dimensions, invalid custom grids, or mutually exclusive
 * options. Runs synchronously before any network activity.
 */
export function validateChartShapeConfig(config: ChartShapeConfig): void {
  if ('shape' in config) {
    if (config.shape === 'rectangular') {
      const hasCustomDimensions = config.rows !== undefined || config.columns !== undefined;
      if (hasCustomDimensions) {
        if (config.days !== undefined) {
          throw new RangeError(DAYS_CONFLICT_MESSAGE);
        }
        const rows = config.rows ?? DEFAULT_ROWS;
        const columns = config.columns ?? DEFAULT_COLUMNS;
        validateRows(rows);
        validateColumns(columns);
        validateRectangularDimensions(rows, columns);
        return;
      }
      validateDays(config.days ?? DEFAULT_DAYS);
      return;
    }
    if ((config as { shape: string }).shape === 'square') {
      throw new RangeError(SQUARE_REMOVED_MESSAGE);
    }
    throw new RangeError(`shape must be 'rectangular' (${SQUARE_REMOVED_MESSAGE})`);
  }
}