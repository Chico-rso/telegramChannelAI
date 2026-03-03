export interface RetryOptions {
  attempts: number;
  delayMs: number;
  factor?: number;
  onRetry?: (error: unknown, attempt: number) => void;
}

function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const factor = options.factor ?? 2;
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === options.attempts) {
        break;
      }

      options.onRetry?.(error, attempt);
      const currentDelay = options.delayMs * factor ** (attempt - 1);
      await sleep(currentDelay);
    }
  }

  throw lastError;
}
