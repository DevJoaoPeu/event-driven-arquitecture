export function RetryDecorator(
  maxAttempts: number = 3,
  delayInMs: number = 5000,
) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalFn = descriptor.value as (args: any[]) => any;

    descriptor.value = async function (...args: any) {
      let lastError: Error = new Error('Unknown error');

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const result: unknown = await originalFn.apply(this, args);
          return result;
        } catch (error) {
          lastError = error as Error;

          console.log(
            `Attempt: ${attempt}, Retrying in ${delayInMs / 1000} seconds`,
          );

          await new Promise((resolve) => setTimeout(resolve, delayInMs));
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}
