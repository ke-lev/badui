import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Collection } from "./collection";
import { entries } from "./entries";
import { bespokeLine } from "./sidekick/lines";

// The frame mounts for real here so focus can be observed. jsdom has no
// layout, so this covers focus order only; the visibility side of the same
// behavior is a browser check.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// jsdom ships neither of these, and the reveal effect reads both on mount.
function stillMedia(media: string) {
  return {
    matches: false,
    media,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  } as MediaQueryList;
}

let host: HTMLDivElement;
let root: Root;

function query<T extends Element>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`nothing matched ${selector}`);
  return found;
}

function click(element: Element) {
  act(() => {
    (element as HTMLElement).click();
  });
}

/** A clipboard whose writes are settled by the test, one call at a time. */
function heldClipboard() {
  const settlers: ((ok: boolean) => void)[] = [];
  const writeText = vi.fn(
    () =>
      new Promise<void>((resolve, reject) => {
        settlers.push((ok) => (ok ? resolve() : reject(new Error("refused"))));
      }),
  );
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  return {
    writeText,
    /** Settles the nth write and lets React flush the result. */
    async finish(index: number, ok = true) {
      await act(async () => {
        settlers[index](ok);
        await Promise.resolve();
      });
    },
  };
}

function railEntries(): HTMLAnchorElement[] {
  return [...document.querySelectorAll<HTMLAnchorElement>(".rail-drawer[data-open='true'] .rail-entry")];
}

/**
 * What Back and Forward do, as the library sees them: the address moves, then
 * `popstate` is fired. jsdom cannot traverse its own session history here, so
 * the real buttons are a browser check; this covers the handling.
 */
function traverseTo(href: string) {
  act(() => {
    window.history.replaceState(null, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
}

const copyButton = () => query<HTMLButtonElement>(".copy-prompt");
const promptToggle = () => query<HTMLButtonElement>(".prompt-card-toggle");
const promptPanel = () => query<HTMLElement>(".prompt-card [role='region']");
const showsCopied = () => copyButton().getAttribute("data-copied") === "true";

function mount() {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => {
    root.render(createElement(Collection));
  });
}

/** Opens the library fresh at an address, the way a shared link does. */
function openAt(href: string) {
  act(() => root.unmount());
  host.remove();
  window.history.replaceState(null, "", href);
  mount();
}

beforeEach(() => {
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
  Reflect.set(globalThis, "IntersectionObserver", NoopObserver);
  Reflect.set(globalThis, "ResizeObserver", NoopObserver);
  Reflect.set(window, "matchMedia", stillMedia);
  window.history.replaceState(null, "", "/collection");
  mount();
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  sessionStorage.clear();
  window.history.replaceState(null, "", "/collection");
});

describe("pane focus", () => {
  it("leaves focus alone on first paint", () => {
    expect(document.activeElement).toBe(document.body);
  });

  it("moves focus to the pane heading when an entry is selected", () => {
    click(query(".rail-drawer[data-open='true'] .rail-entry"));
    expect(document.activeElement).toBe(query("h1#pane-title"));
  });

  it("moves focus to the pane heading when the entry already on show is selected again", () => {
    const railEntry = query<HTMLAnchorElement>(".rail-drawer[data-open='true'] .rail-entry");
    click(railEntry);

    // What reopening the rail over the pane does on a narrow viewport: the
    // menu covers the pane and focus returns to the entry's own button.
    click(query(".rail-toggle"));
    act(() => railEntry.focus());
    expect(document.activeElement).toBe(railEntry);

    click(railEntry);
    expect(document.activeElement).toBe(query("h1#pane-title"));
  });

  it("moves focus to the pane heading when the category already on show is selected again", () => {
    const railCategory = query<HTMLAnchorElement>(".rail-category");
    click(query(".rail-drawer[data-open='true'] .rail-entry"));

    click(railCategory);
    expect(query("h1#pane-title").textContent).not.toBe("");
    expect(document.activeElement).toBe(query("h1#pane-title"));
  });
});

describe("prompt copy feedback", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("marks the prompt it actually copied", async () => {
    const clipboard = heldClipboard();
    click(railEntries()[0]);
    click(copyButton());
    await clipboard.finish(0);
    expect(showsCopied()).toBe(true);
  });

  it("does not carry the mark onto the next entry selected", async () => {
    const clipboard = heldClipboard();
    const [first, second] = railEntries();
    click(first);
    click(copyButton());
    await clipboard.finish(0);
    expect(showsCopied()).toBe(true);

    // Well inside the 1.6s the mark is shown for.
    click(second);
    expect(showsCopied()).toBe(false);
  });

  it("ignores a copy that lands after a newer one was started", async () => {
    const clipboard = heldClipboard();
    const [first, second] = railEntries();
    click(first);
    click(copyButton());
    click(second);
    click(copyButton());
    expect(clipboard.writeText).toHaveBeenCalledTimes(2);

    // The first entry's write completes last; it belongs to no current copy.
    await clipboard.finish(0);
    expect(showsCopied()).toBe(false);

    await clipboard.finish(1);
    expect(showsCopied()).toBe(true);
  });

  it("restarts the pause when the same prompt is copied again", async () => {
    vi.useFakeTimers();
    const clipboard = heldClipboard();
    click(railEntries()[0]);

    click(copyButton());
    await clipboard.finish(0);
    act(() => void vi.advanceTimersByTime(1_500));
    expect(showsCopied()).toBe(true);

    click(copyButton());
    await clipboard.finish(1);
    // Past the first copy's deadline, inside the second's.
    act(() => void vi.advanceTimersByTime(1_500));
    expect(showsCopied()).toBe(true);

    act(() => void vi.advanceTimersByTime(200));
    expect(showsCopied()).toBe(false);
  });

  it("reports a refused copy without marking it", async () => {
    const clipboard = heldClipboard();
    click(railEntries()[0]);
    click(copyButton());
    await clipboard.finish(0, false);
    expect(showsCopied()).toBe(false);
  });
});

describe("agent prompt disclosure", () => {
  it("starts folded into its header", () => {
    click(railEntries()[0]);

    expect(promptToggle().getAttribute("aria-expanded")).toBe("false");
    expect(promptPanel().hidden).toBe(true);
  });

  it("opens from its header and folds again for another entry", () => {
    const [first, second] = railEntries();
    click(first);
    click(promptToggle());
    expect(promptToggle().getAttribute("aria-expanded")).toBe("true");
    expect(promptPanel().hidden).toBe(false);

    click(second);
    expect(promptToggle().getAttribute("aria-expanded")).toBe("false");
    expect(promptPanel().hidden).toBe(true);
  });
});

describe("entry lines", () => {
  // Loading the collection is what hands them over; the splash never does.
  it("gives the cursor companion the entries' lines", () => {
    const keyed = document.createElement("div");
    keyed.setAttribute("data-sidekick", "volume-dial");
    expect(bespokeLine(keyed)).toBe("It goes to 100. It does not go to 100 quickly.");
  });
});

describe("addressing", () => {
  const filed = entries.find((item) => item.meta.category === "sliders")!;

  it("opens the entry its address names, on the shelf it is filed under", () => {
    openAt(`/collection?entry=${filed.id}`);
    expect(query(".rail-entry[aria-current]").textContent).toBe(filed.meta.name);
    expect(document.querySelector(".rail-category[aria-current]")).toBeNull();
  });

  it("opens the shelf its address names", () => {
    openAt("/collection?category=sliders");
    expect(query("h1#pane-title").textContent).toBe("Sliders");
    expect(document.querySelector(".rail-entry[aria-current]")).toBeNull();
  });

  it("opens the shelf the library opens on when the address names nothing it holds", () => {
    openAt("/collection?entry=nowhere");
    expect(query("h1#pane-title").textContent).toBe("Buttons");
  });

  it("rewrites an address it could not use to the one this place is reached by", () => {
    openAt("/collection?category=nowhere");
    expect(window.location.search).toBe("");
  });

  it("writes the entry to the address when the rail opens it", () => {
    const first = railEntries()[0];
    click(first);
    expect(window.location.search).toBe(`?entry=${entries[0].id}`);
    expect(first.getAttribute("href")).toBe(`/collection?entry=${entries[0].id}`);
  });

  it("carries the shelf in the address and the opening shelf in none", () => {
    const shelves = [...document.querySelectorAll<HTMLAnchorElement>(".rail-category")];
    click(shelves[2]);
    expect(window.location.search).toBe("?category=sliders");
    click(shelves[0]);
    expect(window.location.search).toBe("");
  });

  it("follows the address back to the shelf an entry was opened from", () => {
    click(railEntries()[0]);
    expect(query(".rail-entry[aria-current]").textContent).toBe(entries[0].meta.name);

    traverseTo("/collection");
    expect(query("h1#pane-title").textContent).toBe("Buttons");
    expect(document.querySelector(".rail-entry[aria-current]")).toBeNull();

    traverseTo(`/collection?entry=${filed.id}`);
    expect(query(".rail-entry[aria-current]").textContent).toBe(filed.meta.name);
  });

  it("moves focus to the pane heading when the address moves the pane", () => {
    click(railEntries()[0]);
    act(() => query<HTMLButtonElement>(".rail-toggle").focus());
    traverseTo("/collection");
    expect(document.activeElement).toBe(query("h1#pane-title"));
  });

  it("stacks one history entry per place the rail opens", () => {
    const before = window.history.length;
    click(railEntries()[0]);
    click(railEntries()[1]);
    expect(window.history.length).toBe(before + 2);
  });

  it("does not stack an entry for choosing the pane already on show", () => {
    const first = railEntries()[0];
    click(first);
    const stacked = window.history.length;
    click(first);
    click(first);
    expect(window.history.length).toBe(stacked);
    expect(window.location.search).toBe(`?entry=${entries[0].id}`);
  });
});
