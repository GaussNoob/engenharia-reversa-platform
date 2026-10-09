import { afterEach, expect, it, vi } from "vitest";
import { api, configureApi } from "./index";
afterEach(() => vi.useRealTimers());
function waitingTransport(onAbort?: () => void) {
  configureApi({
    origin: "https://api.example.test",
    transport: async (_path, init) =>
      new Promise((_resolve, reject) => {
        const abort = () => {
          onAbort?.();
          reject(init.signal?.reason);
        };
        if (init.signal?.aborted) abort();
        else init.signal?.addEventListener("abort", abort, { once: true });
      }),
  });
}
it("bounds an unreachable API request instead of leaving startup pending", async () => {
  vi.useFakeTimers();
  waitingTransport();
  const pending = api("/me");
  const rejected = expect(pending).rejects.toMatchObject({
    name: "TimeoutError",
  });
  await vi.advanceTimersByTimeAsync(15_000);
  await rejected;
  expect(vi.getTimerCount()).toBe(0);
});
it("propagates caller cancellation and releases its timeout", async () => {
  vi.useFakeTimers();
  const aborted = vi.fn();
  waitingTransport(aborted);
  const controller = new AbortController();
  const pending = api("/catalog", { signal: controller.signal });
  const rejected = expect(pending).rejects.toMatchObject({
    name: "AbortError",
  });
  controller.abort();
  await rejected;
  expect(aborted).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});
it("releases the deadline after a successful response", async () => {
  vi.useFakeTimers();
  configureApi({
    origin: "https://api.example.test",
    transport: async () => Response.json({ ready: true }),
  });
  await expect(api("/health")).resolves.toEqual({ ready: true });
  expect(vi.getTimerCount()).toBe(0);
});
