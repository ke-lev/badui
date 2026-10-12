import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Rotary } from "./rotary";
import styles from "./physical-specimens.module.css";

vi.mock("@/components/reduced-motion", () => ({
  prefersReducedMotion: () => true,
}));

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
  Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
});

function render(realistic?: boolean) {
  act(() => root.render(createElement(Rotary, realistic === undefined ? {} : {
    switches: { realistic },
  })));
}

function dial() {
  return host.querySelector<HTMLDivElement>('[role="group"]')!;
}

function slots() {
  return Array.from(host.querySelectorAll(`.${styles.slot}`), (slot) => slot.textContent);
}

function readout() {
  return document.getElementById(dial().getAttribute("aria-describedby")!)!.textContent!;
}

function status() {
  return host.querySelector('[role="status"]')!.textContent!;
}

function key(digit: string) {
  act(() => dial().dispatchEvent(new KeyboardEvent("keydown", { key: digit, bubbles: true })));
}

function preparePointer() {
  const element = dial();
  element.setPointerCapture = vi.fn();
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    x: 0, y: 0, left: 0, top: 0, right: 200, bottom: 200, width: 200, height: 200,
    toJSON: () => ({}),
  });
}

// The dial's ring is 84 units from its centre in a 224-unit viewBox.
function pointerSample(angle: number, pointerId: number) {
  const radians = angle * Math.PI / 180;
  return {
    button: 0,
    pointerId,
    clientX: (112 + Math.sin(radians) * 84) * 200 / 224,
    clientY: (112 - Math.cos(radians) * 84) * 200 / 224,
  };
}

function pointer(type: string, angle: number, pointerId = 1, coalescedAngles?: number[]) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, pointerSample(angle, pointerId));
  if (coalescedAngles) {
    Object.assign(event, {
      getCoalescedEvents: () => coalescedAngles.map((sampleAngle) => pointerSample(sampleAngle, pointerId)),
    });
  }
  act(() => dial().dispatchEvent(event));
}

function pullNine(rotation: number) {
  // The 9 hole rests at 180 degrees. Small successive moves cross the seam
  // the same way an actual pointer does, without a >180-degree jump.
  pointer("pointerdown", 180);
  for (let travelled = 100; travelled < rotation; travelled += 100) {
    pointer("pointermove", 180 + travelled);
  }
  if (rotation > 0) pointer("pointermove", 180 + rotation);
}

function expectCountOnly(count: number) {
  const countPattern = new RegExp(`\\b${count}\\b[^.]*?(?:digits?|of\\s+10)`, "i");
  expect(readout()).toMatch(countPattern);
  expect(status()).toMatch(countPattern);
}

describe("Rotary modes", () => {
  it("shows and announces each entered digit in Standard by default", () => {
    render();
    key("7");
    expect(slots()).toEqual(["7", "", "", "", "", "", "", "", "", ""]);
    expect(readout()).toBe("Dialed so far: 7");
    expect(status()).toBe("7.");

    key("8");
    expect(slots().slice(0, 3)).toEqual(["7", "8", ""]);
    expect(readout()).toBe("Dialed so far: 78");
    expect(status()).toBe("8.");
  });

  it("keeps digits private in every readout until the tenth Realistic digit", () => {
    render(true);
    for (const [index, digit] of Array.from("123456789").entries()) {
      key(digit);
      expect(slots()).toEqual([
        ...Array<string>(index + 1).fill("•"),
        ...Array<string>(9 - index).fill(""),
      ]);
      expectCountOnly(index + 1);
    }

    key("0");
    expect(slots().join("")).toBe("1234567890");
    expect(readout()).toContain("123 456 7890");
    expect(status()).toBe("Dialed 123 456 7890.");
    expect(dial().getAttribute("aria-disabled")).toBe("true");

    key("5");
    expect(slots().join("")).toBe("1234567890");
  });

  it("hides existing digits and their announcement when switched to Realistic, preserving them when switched back", () => {
    render(false);
    for (const digit of "789") key(digit);
    expect(slots().join("")).toBe("789");

    render(true);
    expect(slots().join("")).toBe("•••");
    expectCountOnly(3);
    expect(readout()).not.toMatch(/[789]/);
    expect(status()).not.toMatch(/[789]/);

    render(false);
    expect(slots().join("")).toBe("789");
    expect(readout()).toBe("Dialed so far: 789");
    expect(status()).toContain("9");
    key("0");
    expect(slots().join("")).toBe("7890");
  });

  it("leaves a completed number visible when the mode changes", () => {
    render(false);
    for (const digit of "1234567890") key(digit);
    render(true);
    expect(slots().join("")).toBe("1234567890");
    expect(readout()).toContain("123 456 7890");
    expect(status()).toBe("Dialed 123 456 7890.");
  });
});

describe("Rotary pointer dialing", () => {
  it("counts the final release position when no move event was delivered in Realistic", () => {
    render(true);
    preparePointer();
    pointer("pointerdown", 180);
    pointer("pointerup", 328);
    expect(slots().join("")).toBe("•");
    expectCountOnly(1);

    render(false);
    expect(slots().join("")).toBe("4");
    expect(readout()).toBe("Dialed so far: 4");
  });

  it("counts reaching the Standard stop on release without a preceding move event", () => {
    render(false);
    preparePointer();
    pointer("pointerdown", 60);
    pointer("pointerup", 120);
    expect(slots().join("")).toBe("1");
    expect(readout()).toBe("Dialed so far: 1");
    expect(status()).toBe("1.");
  });

  it("uses the release position rather than an earlier move to choose the Realistic digit", () => {
    render(true);
    preparePointer();
    pointer("pointerdown", 180);
    pointer("pointermove", 200);
    pointer("pointerup", 328);
    expect(slots().join("")).toBe("•");
    expectCountOnly(1);

    render(false);
    expect(slots().join("")).toBe("4");
    expect(readout()).toBe("Dialed so far: 4");
  });

  it("holds the Realistic stop while an overextended finger moves back toward it", () => {
    render(true);
    preparePointer();
    pointer("pointerdown", 60);
    pointer("pointermove", 200);
    pointer("pointermove", 131);
    pointer("pointerup", 131);
    expect(slots().join("")).toBe("•");
    expectCountOnly(1);

    render(false);
    expect(slots().join("")).toBe("1");
  });

  it("keeps a Standard pull at its stop when the finger eases back from overshoot", () => {
    render(false);
    preparePointer();
    pointer("pointerdown", 60);
    pointer("pointermove", 150);
    pointer("pointermove", 142);
    pointer("pointerup", 142);
    expect(slots().join("")).toBe("1");
    expect(status()).toBe("1.");
  });

  it("ignores another pointer's movement, release, and lost capture during a pull", () => {
    render(true);
    preparePointer();
    pointer("pointerdown", 180);
    pointer("pointermove", 328, 2);
    pointer("pointerup", 328, 2);
    pointer("lostpointercapture", 328, 2);
    expect(slots().join("")).toBe("");
    expect(dial().getAttribute("aria-busy")).toBe("true");

    pointer("pointermove", 328);
    pointer("pointerup", 328);
    pointer("pointerup", 328);
    expect(slots().join("")).toBe("•");
    expectCountOnly(1);

    render(false);
    expect(slots().join("")).toBe("4");
  });

  it.each([false, true])("preserves a clockwise pull across coalesced pointer samples (Realistic=%s)", (realistic) => {
    render(realistic);
    preparePointer();
    pointer("pointerdown", 180);
    pointer("pointermove", 480, 1, [180, 280, 380, 480]);
    pointer("pointerup", 480);
    expect(slots().join("")).toBe(realistic ? "•" : "9");

    render(false);
    expect(slots().join("")).toBe("9");
    expect(readout()).toBe("Dialed so far: 9");
  });

  it("registers nothing for a short Standard pull", () => {
    render(false);
    preparePointer();
    pullNine(148);
    expect(slots().join("")).toBe("");
    pointer("pointerup", 328);
    expect(slots().join("")).toBe("");
    expect(status()).toBe("");
  });

  it("registers the closest digit on release from a short Realistic pull", () => {
    render(true);
    preparePointer();
    pullNine(148);
    expect(slots().join("")).toBe("");
    pointer("pointerup", 328);
    expect(slots().join("")).toBe("•");
    expectCountOnly(1);

    render(false);
    expect(slots().join("")).toBe("4");
    expect(readout()).toBe("Dialed so far: 4");
  });

  it.each([false, true])("does not enter a digit for a stationary press (Realistic=%s)", (realistic) => {
    render(realistic);
    preparePointer();
    pullNine(0);
    pointer("pointerup", 180);
    expect(slots().join("")).toBe("");
    expect(status()).toBe("");
    expect(dial().getAttribute("aria-busy")).toBeNull();
  });

  it.each([
    [false, "pointercancel"],
    [true, "pointercancel"],
    [false, "lostpointercapture"],
    [true, "lostpointercapture"],
  ] as const)("returns without committing after %s mode receives %s", (realistic, cancellation) => {
    render(realistic);
    preparePointer();
    pullNine(300);
    pointer(cancellation, 480);
    expect(slots().join("")).toBe("");
    expect(status()).toBe("");
    expect(dial().getAttribute("aria-busy")).toBeNull();

    key("2");
    expect(slots().join("")).toBe(realistic ? "•" : "2");
  });

  it("keeps the Standard release policy when switched to Realistic during a pull", () => {
    render(false);
    preparePointer();
    pullNine(148);
    render(true);
    pointer("pointerup", 328);
    expect(slots().join("")).toBe("");
    expect(status()).toBe("");
  });

  it("keeps the Realistic release policy when switched to Standard during a pull", () => {
    render(true);
    preparePointer();
    pullNine(148);
    render(false);
    pointer("pointerup", 328);
    expect(slots().join("")).toBe("4");
    expect(readout()).toBe("Dialed so far: 4");
    expect(status()).toBe("4.");
  });
});
