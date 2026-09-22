"use client";

import type { ComponentMeta } from "@/components/meta";
import { DrawnPointerArea } from "./drawn-pointer";
import { heavyPointerPrompt } from "./heavy-pointer.prompt";
import { heavyModel } from "./models";

export function HeavyPointer() {
  return <DrawnPointerArea model={heavyModel} sidekick="heavy-pointer" label="Continue" />;
}

export const heavyPointerMeta: ComponentMeta = {
  name: "Heavy",
  kind: "hostile",
  category: "cursor",
  summary:
    "An area that replaces the system pointer with a springy one that overshoots " +
    "the real position. Continue responds only when the drawn pointer is over it.",
  usage: "<HeavyPointer />",
  prompt: heavyPointerPrompt,
  notes:
    "Stiffness 45, damping ratio 0.22. The drawn pointer starts wherever the " +
    "real one enters the area and disappears when it leaves. Under " +
    "prefers-reduced-motion the spring is critically damped and does not " +
    "overshoot. Tab, Enter, and Space operate the button natively.",
  lines: {
    "heavy-pointer": "It gets there. Then it keeps going for a bit.",
  },
};
