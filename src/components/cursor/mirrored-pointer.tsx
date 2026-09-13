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
    "An area that hides the system pointer and draws its own, reflected across " +
    "the area's vertical centre line. A Continue button sits a quarter of the " +
    "way in from the left; a click presses it only when the drawn pointer is over it.",
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
