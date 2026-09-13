# Cursor Sidekick Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A pointer-following companion that envelopes the hovered element and hangs a tab off it carrying one line of context, in two switchable content modes.

**Architecture:** Two pure functions (`inspect.ts`, `lines.ts`) turn an `Element` into a string. A React context holds the mode and persists it to `localStorage`. One client component runs a single rAF loop that drives two fixed-position elements — a cuff and a tab — writing directly to `.style` with no React state in the hot path.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, Vitest + jsdom.

**Spec:** `docs/superpowers/specs/2026-09-12-cursor-sidekick-design.md`

## Global Constraints

- **Next.js 16 App Router.** `"use client"` goes at the top of the file, before imports. `SiteHeader`/`SiteFooter` in `src/components/site-chrome.tsx` are server components and must stay that way — client interactivity enters as an imported island.
- **Do not change** the `LayoutProps<"/">` type on `RootLayout`. It is a Next 16 typed-route global.
- **Palette, from `src/app/globals.css`:** background `#fbfaf8`, foreground `#282824`, muted `#6b6b63`, rule `#eaeaea`, focus ring `2px solid #4e6145`, accent green `#899176`.
- **Fonts:** `var(--font-geist-mono)` for `dom` readouts, `var(--font-geist-sans)` for `snark` lines.
- **Accessibility:** cuff and tab are always `aria-hidden="true"` and `pointer-events: none`. The layer only mounts under `(pointer: fine) and (hover: hover)`. Under `prefers-reduced-motion: reduce` the cuff snaps instead of trailing.
- **No hydration mismatch:** `localStorage` is read in an effect after mount, never during render. SSR always renders mode `dom`.
- **Copy rule:** snark lines are deadpan. They never name the anti-pattern, never wink, never apologise. Use the exact strings in Task 2 — they are approved copy, not placeholders.
- **The repo has unrelated uncommitted work on `main`.** Every `git add` in this plan is path-scoped to files the task touched. Never `git add -A` or `git add .`.

---

### Task 1: Vitest and the inspector

**Files:**
- Create: `vitest.config.mts`
- Create: `src/components/sidekick/inspect.ts`
- Create: `src/components/sidekick/inspect.test.ts`
- Modify: `package.json` (add `test` script and three devDependencies)

**Interfaces:**
- Consumes: nothing.
- Produces: `inspect(el: Element): string` and `accessibleName(el: Element): string`, both exported from `src/components/sidekick/inspect.ts`. Task 2 imports `inspect`. Task 4 imports `inspect`.

- [ ] **Step 1: Install test dependencies**

Only three. No React Testing Library — the units under test are pure functions over synthetic elements.

```bash
npm install -D vitest jsdom vite-tsconfig-paths
```

- [ ] **Step 2: Create the Vitest config**

Create `vitest.config.mts`:

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Add the test script**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 4: Write the failing tests**

Create `src/components/sidekick/inspect.test.ts`. These cases mirror the real specimen markup in `src/components/specimens/`.

```ts
import { describe, expect, it } from "vitest";
import { accessibleName, inspect } from "./inspect";

function render(html: string): Element {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.append(host);
  return host.firstElementChild as Element;
}

describe("accessibleName", () => {
  it("prefers aria-label", () => {
    const el = render(`<button aria-label="Close confirmation">x</button>`);
    expect(accessibleName(el)).toBe("Close confirmation");
  });

  it("falls back to aria-labelledby text", () => {
    const el = render(
      `<div><p id="t">Are you sure?</p><div role="dialog" aria-labelledby="t"></div></div>`,
    ).querySelector('[role="dialog"]')!;
    expect(accessibleName(el)).toBe("Are you sure?");
  });

  it("falls back to an associated label element", () => {
    render(`<div><label for="d">Date of birth</label><input id="d" type="range"></div>`);
    expect(accessibleName(document.getElementById("d")!)).toBe("Date of birth");
  });

  it("falls back to a wrapping label", () => {
    const el = render(
      `<label><input type="checkbox"><span>Email updates</span></label>`,
    ).querySelector("input")!;
    expect(accessibleName(el)).toBe("Email updates");
  });

  it("falls back to collapsed text content", () => {
    const el = render(`<button>  Save\n  preferences </button>`);
    expect(accessibleName(el)).toBe("Save preferences");
  });

  it("truncates past 40 characters", () => {
    const el = render(`<button aria-label="${"a".repeat(60)}"></button>`);
    expect(accessibleName(el)).toHaveLength(40);
    expect(accessibleName(el).endsWith("…")).toBe(true);
  });

  it("returns an empty string when there is no name", () => {
    expect(accessibleName(render(`<button></button>`))).toBe("");
  });
});

describe("inspect", () => {
  it("reads the volume dial", () => {
    const el = render(
      `<div role="slider" aria-label="Volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="3"></div>`,
    );
    expect(inspect(el)).toBe('slider "Volume" · 0–100 · now 3');
  });

  it("reads the date slider", () => {
    render(
      `<div><label for="dob">Date of birth</label><input id="dob" type="range" min="0" max="46385" step="1" value="35195"></div>`,
    );
    expect(inspect(document.getElementById("dob")!)).toBe(
      'range "Date of birth" · 0–46385 · step 1',
    );
  });

  it("reads a phone digit button", () => {
    const el = render(`<button aria-label="Increase digit 4, currently 0"></button>`);
    expect(inspect(el)).toBe('button "Increase digit 4, currently 0"');
  });

  it("reads a checked checkbox", () => {
    const el = render(
      `<label><input type="checkbox" checked><span>Email updates</span></label>`,
    ).querySelector("input")!;
    expect(inspect(el)).toBe('checkbox "Email updates" · checked');
  });

  it("reads an unchecked checkbox", () => {
    const el = render(
      `<label><input type="checkbox"><span>Product news</span></label>`,
    ).querySelector("input")!;
    expect(inspect(el)).toBe('checkbox "Product news" · unchecked');
  });

  it("reads an invalid password input", () => {
    render(
      `<div><label for="pw">Create a password</label><input id="pw" type="password" aria-invalid="true"></div>`,
    );
    expect(inspect(document.getElementById("pw")!)).toBe(
      'password "Create a password" · aria-invalid',
    );
  });

  it("reads a non-modal dialog", () => {
    const el = render(
      `<div><p id="dt">Are you sure?</p><div role="dialog" aria-modal="false" aria-labelledby="dt"></div></div>`,
    ).querySelector('[role="dialog"]')!;
    expect(inspect(el)).toBe('dialog "Are you sure?" · aria-modal false');
  });

  it("reports a toggle button's pressed state", () => {
    const el = render(`<button aria-label="Show password" aria-pressed="false"></button>`);
    expect(inspect(el)).toBe('button "Show password" · pressed false');
  });

  it("reads an internal link as its destination", () => {
    const el = render(`<a href="/collection">Collection</a>`);
    expect(inspect(el)).toBe("a → /collection");
  });

  it("reads a fragment link as its fragment", () => {
    expect(inspect(render(`<a href="#top">Back to top</a>`))).toBe("a → #top");
  });

  it("reads an external link as host and path", () => {
    const el = render(`<a href="https://example.com/things?q=1">Out</a>`);
    expect(inspect(el)).toBe("a → example.com/things");
  });

  it("drops the path for an external root link", () => {
    expect(inspect(render(`<a href="https://example.com/">Out</a>`))).toBe(
      "a → example.com",
    );
  });

  it("falls back to role for an unhandled role", () => {
    const el = render(`<div role="status" aria-label="3 selected"></div>`);
    expect(inspect(el)).toBe('status "3 selected"');
  });

  it("falls back to tag name for a bare element", () => {
    expect(inspect(render(`<section></section>`))).toBe("section");
  });

  it("reports a disabled button", () => {
    const el = render(`<button disabled>Save</button>`);
    expect(inspect(el)).toBe('button "Save" · disabled');
  });
});
```

- [ ] **Step 5: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./inspect"`.

- [ ] **Step 6: Write the implementation**

Create `src/components/sidekick/inspect.ts`:

```ts
const NAME_MAX = 40;
const SEPARATOR = " · ";
const ELLIPSIS = "…";
const EN_DASH = "–";
const ARROW = "→";

function truncate(value: string): string {
  return value.length > NAME_MAX ? `${value.slice(0, NAME_MAX - 1)}${ELLIPSIS}` : value;
}

function collapse(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function join(parts: Array<string | false | null | undefined>): string {
  return parts.filter((part): part is string => Boolean(part)).join(SEPARATOR);
}

export function accessibleName(el: Element): string {
  const label = el.getAttribute("aria-label");
  if (label && collapse(label)) return truncate(collapse(label));

  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const text = collapse(
      labelledBy
        .split(/\s+/)
        .map((id) => el.ownerDocument.getElementById(id)?.textContent ?? "")
        .join(" "),
    );
    if (text) return truncate(text);
  }

  if (
    el instanceof HTMLInputElement ||
    el instanceof HTMLSelectElement ||
    el instanceof HTMLTextAreaElement
  ) {
    const text = collapse(
      Array.from(el.labels ?? [])
        .map((node) => node.textContent ?? "")
        .join(" "),
    );
    if (text) return truncate(text);
  }

  const title = el.getAttribute("title");
  if (title && collapse(title)) return truncate(collapse(title));

  const text = collapse(el.textContent ?? "");
  return text ? truncate(text) : "";
}

function quotedName(el: Element): string {
  const name = accessibleName(el);
  return name ? ` "${name}"` : "";
}

function span(min: string | null, max: string | null): string {
  return min !== null && max !== null ? `${min}${EN_DASH}${max}` : "";
}

function destination(el: HTMLAnchorElement): string {
  const href = el.getAttribute("href");
  if (!href) return EN_DASH;
  if (!/^https?:/i.test(href)) return href;
  try {
    const url = new URL(href);
    return url.pathname === "/" ? url.host : `${url.host}${url.pathname}`;
  } catch {
    return href;
  }
}

function inspectInput(el: HTMLInputElement, quoted: string): string {
  if (el.type === "range") {
    const step = el.getAttribute("step");
    return join([
      `range${quoted}`,
      span(el.getAttribute("min"), el.getAttribute("max")),
      step && `step ${step}`,
    ]);
  }

  if (el.type === "checkbox" || el.type === "radio") {
    return join([`${el.type}${quoted}`, el.checked ? "checked" : "unchecked"]);
  }

  return join([
    `${el.type}${quoted}`,
    el.getAttribute("aria-invalid") !== null && "aria-invalid",
    el.required && "required",
    el.disabled && "disabled",
  ]);
}

export function inspect(el: Element): string {
  const quoted = quotedName(el);
  const role = el.getAttribute("role");

  if (role === "slider") {
    const now = el.getAttribute("aria-valuenow");
    return join([
      `slider${quoted}`,
      span(el.getAttribute("aria-valuemin"), el.getAttribute("aria-valuemax")),
      now !== null && `now ${now}`,
    ]);
  }

  if (role === "dialog") {
    const modal = el.getAttribute("aria-modal");
    return join([`dialog${quoted}`, modal !== null && `aria-modal ${modal}`]);
  }

  if (el instanceof HTMLAnchorElement) return `a ${ARROW} ${destination(el)}`;
  if (el instanceof HTMLInputElement) return inspectInput(el, quoted);

  if (el instanceof HTMLButtonElement) {
    const pressed = el.getAttribute("aria-pressed");
    const expanded = el.getAttribute("aria-expanded");
    return join([
      `button${quoted}`,
      pressed !== null && `pressed ${pressed}`,
      expanded !== null && `expanded ${expanded}`,
      el.disabled && "disabled",
    ]);
  }

  return `${role ?? el.tagName.toLowerCase()}${quoted}`;
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, 22 tests.

- [ ] **Step 8: Verify lint and build stay green**

Run: `npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 9: Commit**

```bash
git add vitest.config.mts package.json package-lock.json src/components/sidekick/inspect.ts src/components/sidekick/inspect.test.ts
git commit -m "feat: add sidekick DOM inspector with vitest coverage"
```

---

### Task 2: Bespoke lines and specimen keys

**Files:**
- Create: `src/components/sidekick/lines.ts`
- Create: `src/components/sidekick/lines.test.ts`
- Modify: `src/components/specimens/physical-specimens.tsx`
- Modify: `src/components/specimens/form-specimens.tsx`
- Modify: `src/components/collection.tsx`

**Interfaces:**
- Consumes: `inspect(el: Element): string` from `./inspect`.
- Produces: `line(el: Element): string` exported from `src/components/sidekick/lines.ts`. Task 4 imports it.

- [ ] **Step 1: Write the failing tests**

Create `src/components/sidekick/lines.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { line } from "./lines";

function render(html: string): Element {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.append(host);
  return host.firstElementChild as Element;
}

describe("line", () => {
  it("returns the bespoke line for a keyed element", () => {
    const el = render(`<div data-sidekick="volume-dial" role="slider"></div>`);
    expect(line(el)).toBe("It goes to 100. It does not go to 100 quickly.");
  });

  it("inherits the nearest keyed ancestor", () => {
    const el = render(
      `<div data-sidekick="dialog"><button>Cancel</button></div>`,
    ).querySelector("button")!;
    expect(line(el)).toBe("Cancel goes back one. Everything else goes forward.");
  });

  it("prefers the closest key over an ancestor's", () => {
    const el = render(
      `<div data-sidekick="dialog"><button data-sidekick="dialog-close"></button></div>`,
    ).querySelector("button")!;
    expect(line(el)).toBe("This is not an exit.");
  });

  it("falls back to the inspector when there is no key", () => {
    expect(line(render(`<a href="/collection">Collection</a>`))).toBe(
      "a → /collection",
    );
  });

  it("falls back to the inspector for an unknown key", () => {
    const el = render(`<button data-sidekick="nope" aria-label="Save"></button>`);
    expect(line(el)).toBe('button "Save"');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./lines"`.

- [ ] **Step 3: Write the implementation**

Create `src/components/sidekick/lines.ts`. These strings are approved copy — reproduce them exactly.

```ts
import { inspect } from "./inspect";

const LINES: Record<string, string> = {
  "volume-dial": "It goes to 100. It does not go to 100 quickly.",
  "date-slider": "One hundred and twenty-seven years. One groove.",
  password: "Meeting a requirement is how you find the next one.",
  checkboxes: "Each one has an opinion about its neighbour.",
  "phone-digit": "Every digit is on speaking terms with the next.",
  dialog: "Cancel goes back one. Everything else goes forward.",
  "dialog-close": "This is not an exit.",
  reset: "The only control here that does what it says.",
};

export function line(el: Element): string {
  const key = el.closest("[data-sidekick]")?.getAttribute("data-sidekick");
  if (key && key in LINES) return LINES[key];
  return inspect(el);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, 27 tests total.

- [ ] **Step 5: Add the keys to the physical specimens**

In `src/components/specimens/physical-specimens.tsx`:

- On the `VolumeControl` dial `<div>` (the one with `role="slider"`), add `data-sidekick="volume-dial"`.
- On the `DatePicker` `<input type="range">`, add `data-sidekick="date-slider"`.
- On the `PhoneNumber` digit `<button>`, add `data-sidekick="phone-digit"`.

- [ ] **Step 6: Add the keys to the form specimens**

In `src/components/specimens/form-specimens.tsx`:

- On the `PasswordField` password `<input>` (the one with `ref={inputRef}`), add `data-sidekick="password"`.
- On the `CheckboxGroup` `<fieldset className={styles.preferenceFieldset}>`, add `data-sidekick="checkboxes"`.
- On the `ConfirmDialog` `<div className={styles.dialog}>` (the one with `role="dialog"`), add `data-sidekick="dialog"`.
- On the `ConfirmDialog` close `<button className={styles.closeButton}>`, add `data-sidekick="dialog-close"`.

- [ ] **Step 7: Add the keys to the reset controls**

In `src/components/collection.tsx`, add `data-sidekick="reset"` to both the `.reset-all` button and the `.specimen-reset` button.

- [ ] **Step 8: Verify lint and build stay green**

Run: `npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 9: Commit**

```bash
git add src/components/sidekick/lines.ts src/components/sidekick/lines.test.ts src/components/specimens/physical-specimens.tsx src/components/specimens/form-specimens.tsx src/components/collection.tsx
git commit -m "feat: add sidekick snark lines and specimen keys"
```

---

### Task 3: Mode context and footer control

**Files:**
- Create: `src/components/sidekick/sidekick-mode.tsx`
- Create: `src/components/sidekick/sidekick-control.tsx`
- Create: `src/components/sidekick/sidekick.module.css`
- Modify: `src/components/site-chrome.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `type SidekickMode = "dom" | "snark" | "off"`
  - `SidekickModeProvider({ children }: { children: ReactNode })`
  - `useSidekickMode(): { mode: SidekickMode; setMode: (next: SidekickMode) => void }`
  - `SidekickControl()`
  - All from `src/components/sidekick/sidekick-mode.tsx` except `SidekickControl`, which is in `sidekick-control.tsx`. Task 4 calls `useSidekickMode`.

- [ ] **Step 1: Create the mode context**

Create `src/components/sidekick/sidekick-mode.tsx`:

```tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type SidekickMode = "dom" | "snark" | "off";

export const DEFAULT_MODE: SidekickMode = "dom";
const STORAGE_KEY = "badui:sidekick-mode";

function isMode(value: unknown): value is SidekickMode {
  return value === "dom" || value === "snark" || value === "off";
}

type SidekickModeValue = {
  mode: SidekickMode;
  setMode: (next: SidekickMode) => void;
};

const SidekickModeContext = createContext<SidekickModeValue>({
  mode: DEFAULT_MODE,
  setMode: () => {},
});

export function SidekickModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<SidekickMode>(DEFAULT_MODE);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isMode(stored)) setModeState(stored);
    } catch {
      // Storage unavailable; the default stands.
    }
  }, []);

  const setMode = useCallback((next: SidekickMode) => {
    setModeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable; the choice lasts for this page only.
    }
  }, []);

  return (
    <SidekickModeContext value={{ mode, setMode }}>{children}</SidekickModeContext>
  );
}

export function useSidekickMode(): SidekickModeValue {
  return useContext(SidekickModeContext);
}
```

Note: React 19 renders a context object directly as a provider — `<SidekickModeContext value={...}>`, not `<SidekickModeContext.Provider>`.

- [ ] **Step 2: Create the stylesheet with the control styles**

Create `src/components/sidekick/sidekick.module.css`. Task 4 appends the cuff and tab rules to this same file.

```css
.control {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 0;
  padding: 0;
  border: 0;
}

.legend {
  float: left;
  margin-right: 14px;
  padding: 0;
  color: #6b6b63;
  font-size: 12px;
}

.option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  color: #6b6b63;
  font-size: 12px;
  cursor: pointer;
}

.option:hover {
  color: #282824;
}

.option input {
  width: 13px;
  height: 13px;
  margin: 0;
  accent-color: #4e6145;
  cursor: pointer;
}

.option input:checked + span {
  color: #282824;
}
```

- [ ] **Step 3: Create the control**

Create `src/components/sidekick/sidekick-control.tsx`:

```tsx
"use client";

import styles from "./sidekick.module.css";
import { useSidekickMode, type SidekickMode } from "./sidekick-mode";

const OPTIONS: Array<{ value: SidekickMode; label: string }> = [
  { value: "dom", label: "DOM" },
  { value: "snark", label: "Snark" },
  { value: "off", label: "Off" },
];

export function SidekickControl() {
  const { mode, setMode } = useSidekickMode();

  return (
    <fieldset className={styles.control}>
      <legend className={styles.legend}>Sidekick</legend>
      {OPTIONS.map((option) => (
        <label className={styles.option} key={option.value}>
          <input
            type="radio"
            name="sidekick-mode"
            value={option.value}
            checked={mode === option.value}
            onChange={() => setMode(option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
```

- [ ] **Step 4: Put the control in the footer**

In `src/components/site-chrome.tsx`, add the import at the top and render the control inside `SiteFooter`, between `.footer-note` and the back-to-top link. `SiteFooter` stays a server component — `SidekickControl` is a client island.

```tsx
import { SidekickControl } from "@/components/sidekick/sidekick-control";
```

```tsx
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span className="footer-brand">badui</span>
      <span className="footer-note">End of collection</span>
      <SidekickControl />
      <a href="#top">Back to top <span aria-hidden="true">↑</span></a>
    </footer>
  );
}
```

- [ ] **Step 5: Wrap the app in the provider**

In `src/app/layout.tsx`, add the import and wrap `{children}`. Leave the `LayoutProps<"/">` type alone.

```tsx
import { SidekickModeProvider } from "@/components/sidekick/sidekick-mode";
```

```tsx
      <body>
        <SidekickModeProvider>{children}</SidekickModeProvider>
      </body>
```

- [ ] **Step 6: Verify the control renders and persists**

Run: `npm run dev`, open `http://localhost:3000/collection`, scroll to the footer.
Expected: three radios labelled DOM / Snark / Off, with DOM selected. Select Snark, reload the page, and confirm Snark is still selected. Tab to the group and confirm a visible focus ring. Check the browser console for hydration warnings — there must be none.

- [ ] **Step 7: Verify lint and build stay green**

Run: `npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 8: Commit**

```bash
git add src/components/sidekick/sidekick-mode.tsx src/components/sidekick/sidekick-control.tsx src/components/sidekick/sidekick.module.css src/components/site-chrome.tsx src/app/layout.tsx
git commit -m "feat: add sidekick mode context and footer control"
```

---

### Task 4: The sidekick layer

**Files:**
- Create: `src/components/sidekick/sidekick.tsx`
- Modify: `src/components/sidekick/sidekick.module.css` (append)
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `inspect` from `./inspect`, `line` from `./lines`, `useSidekickMode` from `./sidekick-mode`.
- Produces: `Sidekick()` exported from `src/components/sidekick/sidekick.tsx`.

- [ ] **Step 1: Append the cuff and tab styles**

Append to `src/components/sidekick/sidekick.module.css`:

```css
.layer {
  position: fixed;
  inset: 0;
  z-index: 60;
  pointer-events: none;
}

.cuff {
  position: fixed;
  top: 0;
  left: 0;
  border: 1.5px solid #4e6145;
  background: rgba(137, 145, 118, 0.09);
  will-change: transform, width, height;
}

.tab {
  position: fixed;
  top: 0;
  left: 0;
  max-width: 320px;
  padding: 5px 9px;
  border-radius: 5px;
  background: #282824;
  color: #fbfaf8;
  font-size: 11px;
  line-height: 1.45;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0;
  transition: opacity 140ms ease;
  will-change: transform, opacity;
}

.tabVisible {
  opacity: 1;
}

.tabDom {
  font-family: var(--font-geist-mono), monospace;
  letter-spacing: -0.2px;
}

.tabSnark {
  font-family: var(--font-geist-sans), sans-serif;
}
```

- [ ] **Step 2: Write the sidekick component**

Create `src/components/sidekick/sidekick.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { inspect } from "./inspect";
import { line } from "./lines";
import styles from "./sidekick.module.css";
import { useSidekickMode } from "./sidekick-mode";

const TARGETS =
  'a[href], button, input, select, textarea, [role="slider"], [role="dialog"], [data-sidekick]';

const IDLE_RADIUS = 12;
const PAD = 6;
const IDLE_FOLLOW = 0.18;
const LOCK_FOLLOW = 0.3;
const LOCK_BLEND = 0.22;
const SETTLE = 0.05;
const MAX_STRETCH = 0.26;
const STRETCH_DIVISOR = 3200;
const TAB_GAP = 9;
const TAB_HEIGHT = 26;
const TAB_CLEARANCE = 80;

function approach(current: number, target: number, k: number): number {
  const next = current + (target - current) * k;
  return Math.abs(target - next) < SETTLE ? target : next;
}

function radiusOf(el: Element): number {
  const parsed = Number.parseFloat(getComputedStyle(el).borderTopLeftRadius);
  return Number.isFinite(parsed) ? parsed + PAD : 8;
}

export function Sidekick() {
  const { mode } = useSidekickMode();
  const [enabled, setEnabled] = useState(false);
  const [text, setText] = useState("");

  const cuffRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<Element | null>(null);
  const textRef = useRef("");
  const pointerRef = useRef({ x: -100, y: -100 });
  const modeRef = useRef(mode);

  modeRef.current = mode;

  // Depending on `mode` directly would tear down and rebuild the loop on every
  // DOM/Snark switch, resetting the cuff to the top-left corner. Only the Off
  // transition should restart it; the loop reads the live mode from modeRef.
  const active = enabled && mode !== "off";

  useEffect(() => {
    setEnabled(window.matchMedia("(pointer: fine) and (hover: hover)").matches);
  }, []);

  useEffect(() => {
    if (!active) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cuff = cuffRef.current;
    const tab = tabRef.current;
    if (!cuff || !tab) return;

    const box = { x: -100, y: -100, w: IDLE_RADIUS * 2, h: IDLE_RADIUS * 2, r: IDLE_RADIUS };
    let lock = 0;
    let angle = 0;
    let frame = 0;
    let last = performance.now();

    function publish(next: string) {
      if (next === textRef.current) return;
      textRef.current = next;
      setText(next);
    }

    function onPointerMove(event: PointerEvent) {
      pointerRef.current = { x: event.clientX, y: event.clientY };
    }

    function onPointerOver(event: PointerEvent) {
      const origin = event.target;
      targetRef.current = origin instanceof Element ? origin.closest(TARGETS) : null;
    }

    function onPointerLeave() {
      targetRef.current = null;
    }

    function tick(now: number) {
      frame = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const el = targetRef.current;
      if (el && !el.isConnected) targetRef.current = null;

      const locked = Boolean(targetRef.current);

      let tx: number;
      let ty: number;
      let tw: number;
      let th: number;
      let tr: number;

      if (locked && el) {
        const rect = el.getBoundingClientRect();
        tx = rect.left - PAD;
        ty = rect.top - PAD;
        tw = rect.width + PAD * 2;
        th = rect.height + PAD * 2;
        tr = radiusOf(el);
        // Re-described every frame so a readout stays live while the element
        // changes underneath the cursor — turning the dial moves aria-valuenow.
        // publish() bails when the string is unchanged, so this is not a
        // per-frame render.
        publish(modeRef.current === "snark" ? line(el) : inspect(el));
      } else {
        tx = pointerRef.current.x - IDLE_RADIUS;
        ty = pointerRef.current.y - IDLE_RADIUS;
        tw = IDLE_RADIUS * 2;
        th = IDLE_RADIUS * 2;
        tr = IDLE_RADIUS;
        publish("");
      }

      const base = locked ? LOCK_FOLLOW : IDLE_FOLLOW;
      const k = reduced ? 1 : 1 - Math.pow(1 - base, dt * 60);

      const previousX = box.x;
      const previousY = box.y;
      box.x = approach(box.x, tx, k);
      box.y = approach(box.y, ty, k);
      box.w = approach(box.w, tw, k);
      box.h = approach(box.h, th, k);
      box.r = approach(box.r, tr, k);

      const lockK = reduced ? 1 : 1 - Math.pow(1 - LOCK_BLEND, dt * 60);
      lock += ((locked ? 1 : 0) - lock) * lockK;

      const dx = box.x - previousX;
      const dy = box.y - previousY;
      const speed = Math.hypot(dx, dy) / Math.max(dt, 0.001);
      const free = 1 - lock;
      const stretch = reduced
        ? 0
        : Math.min(speed / STRETCH_DIVISOR, MAX_STRETCH) * free;
      if (speed > 20) angle = Math.atan2(dy, dx);

      cuff.style.width = `${box.w}px`;
      cuff.style.height = `${box.h}px`;
      cuff.style.borderRadius = `${box.r}px`;
      cuff.style.transform =
        `translate3d(${box.x}px, ${box.y}px, 0) ` +
        `rotate(${angle * free}rad) ` +
        `scale(${1 + stretch}, ${1 - stretch})`;

      const below = box.y + box.h + TAB_GAP;
      const flip = below + TAB_HEIGHT > window.innerHeight - TAB_CLEARANCE;
      const tabY = flip ? box.y - TAB_GAP - TAB_HEIGHT : below;
      tab.style.transform = `translate3d(${box.x}px, ${tabY}px, 0)`;
    }

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerover", onPointerOver, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave, { passive: true });
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerleave", onPointerLeave);
      targetRef.current = null;
      textRef.current = "";
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className={styles.layer} aria-hidden="true">
      <div className={styles.cuff} ref={cuffRef} />
      <div
        className={[
          styles.tab,
          text ? styles.tabVisible : "",
          mode === "snark" ? styles.tabSnark : styles.tabDom,
        ]
          .filter(Boolean)
          .join(" ")}
        ref={tabRef}
      >
        {text}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Mount the layer**

In `src/app/layout.tsx`, add the import and render `<Sidekick />` inside the provider, after `{children}`.

```tsx
import { Sidekick } from "@/components/sidekick/sidekick";
```

```tsx
      <body>
        <SidekickModeProvider>
          {children}
          <Sidekick />
        </SidekickModeProvider>
      </body>
```

- [ ] **Step 4: Verify the behaviour in the browser**

Run: `npm run dev`, open `http://localhost:3000/collection`.

Check each of these:
1. The blob trails the cursor and decelerates into it without overshoot.
2. Moving fast produces visible stretch along the direction of travel; it settles to a circle at rest.
3. Hovering the volume dial envelopes it and the tab reads `slider "Volume" · 0–100 · now 0`.
   Drag the dial without leaving it: the `now` figure must climb live in the tab. If it stays at 0, the per-frame republish is broken.
4. Hovering the date slider reads `range "Date of birth" · 0–46385 · step 1`.
5. Hovering the dialog's close button reads `button "Close confirmation"` — click it and confirm the depth increases while the label stays the same.
6. Clicking through several confirmations grows the dialog; the cuff tracks the new size without lag or drift.
7. Switching the footer control to Snark changes the tab copy immediately, with no page reload and without moving the cuff.
8. Switching to Off removes the layer entirely.
9. Near the bottom of the viewport the tab flips above the cuff instead of clipping.

- [ ] **Step 5: Verify reduced motion**

In devtools, emulate `prefers-reduced-motion: reduce` and reload.
Expected: the cuff snaps to the cursor and to targets with no trailing and no stretch. The tab still cross-fades and still shows the right text.

- [ ] **Step 6: Verify the touch gate**

In devtools, emulate a mobile device (coarse pointer) and reload.
Expected: no cuff, no tab, and no pointer listeners attached. The footer control still renders.

- [ ] **Step 7: Verify tests, lint and build**

Run: `npm test && npm run lint && npm run build`
Expected: all three succeed.

- [ ] **Step 8: Commit**

```bash
git add src/components/sidekick/sidekick.tsx src/components/sidekick/sidekick.module.css src/app/layout.tsx
git commit -m "feat: add cursor sidekick layer with dom and snark modes"
```

---

## Notes for the executor

- **Why the tab is a sibling, not a child, of the cuff.** The cuff carries a `rotate` and a non-uniform `scale`. A nested tab would inherit both and shear. Both elements are positioned independently from the same rAF loop.
- **Why the rect is measured every frame.** The specimens resize under the cursor — `ConfirmDialog` grows its stack, `PasswordField` gains requirement rows. A cached rect goes stale mid-hover. One `getBoundingClientRect()` per frame on a single element is not a bottleneck.
- **Why `lock` is a lerped scalar rather than a boolean.** It fades stretch and rotation out as the blob becomes a cuff. Zeroing them on a boolean pops, because rotation of a non-square rect is visible even when the scale is uniform.
- **Why the effect depends on `active`, not `mode`.** Depending on `mode` would tear the rAF loop down and rebuild it on every DOM/Snark switch, resetting the cuff to the corner and making it fly back across the screen. Only the Off transition should restart the loop; the live mode is read from `modeRef` inside `tick`.
- **Why the text is republished every frame.** The readout has to stay live while the element mutates under a held cursor — turning the dial changes `aria-valuenow`, and a readout frozen at `now 0` would waste the best moment in the whole feature. `publish()` compares against a ref and bails when the string is unchanged, so a steady hover causes no re-renders at all.
