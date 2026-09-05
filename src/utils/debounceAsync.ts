/**
 * Delays an async call until it stops being made for `delay` ms. Every caller
 * that arrived during the wait is settled with the single outcome — resolved
 * together on success, rejected together on failure — so no promise is left
 * hanging on the callers that were superseded.
 */
export default function debounceAsync<Args extends unknown[], Result>(
  callback: (...args: Args) => Promise<Result>,
  delay: number,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let waiting: { resolve: (result: Result) => void; reject: (reason: unknown) => void }[] = [];

  return (...args: Args) =>
    new Promise<Result>((resolve, reject) => {
      waiting.push({ resolve, reject });
      clearTimeout(timer);

      timer = setTimeout(() => {
        const settlers = waiting;
        waiting = [];

        callback(...args).then(
          result => {
            for (const { resolve: settle } of settlers) settle(result);
          },
          (reason: unknown) => {
            for (const { reject: fail } of settlers) fail(reason);
          },
        );
      }, delay);
    });
}
