/**
 * Delays an async call until it stops being made for `delay` ms. Every caller
 * that arrived during the wait is resolved with the single result, so no
 * promise is left hanging on the callers that were superseded.
 */
export default function debounceAsync<Args extends unknown[], Result>(
  callback: (...args: Args) => Promise<Result>,
  delay: number,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let waiting: ((result: Result) => void)[] = [];

  return (...args: Args) =>
    new Promise<Result>((resolve, reject) => {
      waiting.push(resolve);
      clearTimeout(timer);

      timer = setTimeout(() => {
        const resolvers = waiting;
        waiting = [];

        callback(...args).then(result => {
          for (const settle of resolvers) settle(result);
        }, reject);
      }, delay);
    });
}
