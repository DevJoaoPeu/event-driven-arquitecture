import { Logger } from '@nestjs/common';

export interface RetryOptions {
  maxAttempts?: number;
  delayInMs?: number;
  backoff?: 'fixed' | 'exponential';
  shouldRetry?: (error: unknown) => boolean;
}

export function Retry({
  maxAttempts = 3,
  delayInMs = 5000,
  backoff = 'fixed',
  shouldRetry = () => true,
}: RetryOptions = {}) {
  return function <This, Args extends unknown[], Return>(
    _target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<
      (this: This, ...args: Args) => Promise<Return>
    >,
  ) {
    const originalFn = descriptor.value!;
    const logger = new Logger(`Retry:${String(propertyKey)}`);

    descriptor.value = async function (
      this: This,
      ...args: Args
    ): Promise<Return> {
      let lastError: unknown;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await originalFn.apply(this, args);
        } catch (error) {
          lastError = error;
          if (attempt === maxAttempts || !shouldRetry(error)) break;

          const wait =
            backoff === 'exponential'
              ? delayInMs * 2 ** (attempt - 1)
              : delayInMs;

          logger.warn(
            `Attempt ${attempt}/${maxAttempts} failed. Retrying in ${wait / 1000}s`,
          );
          await new Promise((resolve) => setTimeout(resolve, wait));
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}
