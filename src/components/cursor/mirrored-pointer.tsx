"use client";

import type { ComponentMeta } from "@/components/meta";
import { DrawnPointerArea } from "./drawn-pointer";
import { mirroredPointerPrompt } from "./mirrored-pointer.prompt";
import { mirroredModel } from "./models";

export function MirroredPointer() {
  return <DrawnPointerArea model={mirroredModel} sidekick="mirrored-pointer" label="Continue" offset />;
}

export const mirroredPointerMeta: ComponentMeta = {
  name: "Mirrored",
  kind: "hostile",
  category: "cursor",
  summary:
    "An area that reflects the pointer across its vertical centreline. Continue " +
    "responds only when the reflected pointer reaches it.",
  usage: "<MirroredPointer />",
  prompt: mirroredPointerPrompt,
  notes:
    "The button ignores the real pointer, and its hover state follows the drawn " +
    "one. Clicks are resolved by the area against the drawn position. Tab, Enter, " +
    "and Space operate the button natively. Presses are counted in a polite live region.",
  lines: {
    "mirrored-pointer": "Every move is honoured, from the other side.",
  },
};
