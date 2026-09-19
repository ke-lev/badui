import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Thinking } from "./thinking";

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
  vi.useFakeTimers();
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root.render(createElement(Thinking)));
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
  Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
});

function button() { return host.querySelector("button")!; }
function status() { return host.querySelector('[role="status"]')!.textContent; }
function percent() { return Number(host.querySelector('[role="progressbar"]')!.getAttribute("aria-valuenow")); }
function next() { act(() => vi.advanceTimersToNextTimer()); }
function until(predicate: () => boolean) {
  for (let i = 0; i < 500 && !predicate(); i++) next();
  expect(predicate()).toBe(true);
}

describe("Thinking sequence", () => {
  it("counts down the visible estimate while the status keeps the starting one", () => {
    act(() => button().click());
    const countdown = () => host.querySelector('[role="status"] + [aria-hidden="true"]')!.textContent;
    expect(countdown()).toBe("About 3 seconds remaining");
    act(() => vi.advanceTimersByTime(1050));
    expect(countdown()).toBe("About 2 seconds remaining");
    expect(status()).toBe("About 3 seconds remaining");
  });

  it("forgets its estimate after compaction and spends its last credits while progress stays fixed", () => {
    act(() => button().click());
    until(() => status() === "Compacting conversation");
    expect(percent()).toBeGreaterThan(85);
    expect(host.textContent).toContain("Usage credits remaining: 10%.");
    next();
    expect(percent()).toBe(24.5);
    expect(status()).toBe("About 3 seconds remaining");
    expect(host.textContent).toContain("Usage credits remaining: 10%.");
    until(() => percent() >= (24.5 + 95) / 2);
    expect(host.textContent).toContain("Usage credits remaining: 5%.");

    until(() => status() === "Estimating remaining work");
    expect(percent()).toBe(95);
    expect(host.textContent).toContain("Usage credits remaining: 5%.");
    next();
    expect(status()).toBe("Remaining work: 5%");
    expect(percent()).toBe(95);
    expect(host.textContent).toContain("Usage credits remaining: 3%.");
    next();
    expect(status()).toBe("Checking available credits");
    expect(host.textContent).toContain("Usage credits remaining: 1%.");
    next();
    expect(status()).toBe("Upload stopped");
    expect(percent()).toBe(95);
    expect(host.textContent).toContain("Usage credits remaining: 0%.");
    expect(host.textContent).toContain("Stopped at 95.0%.");
    expect(vi.getTimerCount()).toBe(0);
    expect(button().getAttribute("aria-label")).toBe("Upload");
    act(() => button().click());
    expect(percent()).toBe(0);
    expect(status()).toBe("About 3 seconds remaining");
    expect(host.textContent).not.toContain("Usage credits remaining");
  });

  it("cancels a pending thought when stopped and starts a clean run", () => {
    act(() => button().click());
    until(() => status() === "Web search: how to upload files");
    act(() => button().click());
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(60_000));
    expect(status()).toBe("Ready to upload");
    expect(percent()).toBe(0);
    expect(host.querySelector("details")).toBeNull();
    act(() => button().click());
    until(() => status() === "Thinking");
    expect(percent()).toBe(43);
  });
});
