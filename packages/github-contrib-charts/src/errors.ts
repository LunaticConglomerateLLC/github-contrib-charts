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