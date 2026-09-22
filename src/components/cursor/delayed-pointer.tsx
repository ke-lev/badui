"use client";

import type { ComponentMeta } from "@/components/meta";
import { DrawnPointerArea } from "./drawn-pointer";
import { delayedPointerPrompt } from "./delayed-pointer.prompt";
import { delayedModel } from "./models";

const model = () => delayedModel();

export function DelayedPointer() {
  return <DrawnPointerArea model={model} sidekick="delayed-pointer" label="Continue" />;
}

export const delayedPointerMeta: ComponentMeta = {
  name: "Delayed",
  kind: "hostile",
  category: "cursor",
  summary:
    "An area that replaces the system pointer with one shown 450 milliseconds late. " +
    "Continue responds only when the drawn pointer is over it.",
  usage: "<DelayedPointer />",
  prompt: delayedPointerPrompt,
  notes:
    "Positions replay exactly as recorded, without interpolation. A click is " +
    "resolved at the moment it happens, against the drawn position. Tab, Enter, " +
    "and Space operate the button natively. Presses are counted in a polite live region.",
  lines: {
    "delayed-pointer": "It is on its way.",
  },
};
