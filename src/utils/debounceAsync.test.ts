import debounceAsync from "@utils/debounceAsync";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("debounceAsync", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("runs once for a burst of calls, with the last arguments", async () => {
    const search = vi.fn((query: string) => Promise.resolve(`results for ${query}`));
    const debounced = debounceAsync(search, 200);

    const results = Promise.all([debounced("bal"), debounced("balla"), debounced("ballarat")]);

    await vi.advanceTimersByTimeAsync(200);

    expect(search).toHaveBeenCalledOnce();
    expect(search).toHaveBeenCalledWith("ballarat");

    // Every caller settles, so react-select is never left waiting on a
    // superseded keystroke.
    expect(await results).toStrictEqual([
      "results for ballarat",
      "results for ballarat",
      "results for ballarat",
    ]);
  });

  it("runs again once the calls stop and start", async () => {
    const search = vi.fn((query: string) => Promise.resolve(query));
    const debounced = debounceAsync(search, 200);

    const first = debounced("ballarat");
    await vi.advanceTimersByTimeAsync(200);

    const second = debounced("geelong");
    await vi.advanceTimersByTimeAsync(200);

    expect(await first).toBe("ballarat");
    expect(await second).toBe("geelong");
    expect(search).toHaveBeenCalledTimes(2);
  });
});
