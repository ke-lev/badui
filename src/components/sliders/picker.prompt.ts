import { PI_DIGITS } from "./pi-digits";

export const piCkerPrompt = `WHAT TO BUILD
Build a portable React + TypeScript component named PiCker. It takes no props and is used as <PiCker />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a native input type="range" with min=0, max=604, step=1, a controlled numeric position starting at 0, and aria-label="πcker".
- Above the range, render an aria-hidden paragraph holding a three-column digit strip: a right-aligned span for the text before the pair, a mark element holding the pair in the centre column, and a left-aligned span for the text after it.
- Set the range's aria-valuetext to “π decimal digits ” followed by the selected pair, e.g. “π decimal digits 14”.

BEHAVIOR
- Define DIGITS as exactly this 606-character string, the first 606 decimal digits of π:
${PI_DIGITS}
- For the strip, let full = "3." + DIGITS and at = position + 2. before = full.slice(Math.max(0, at − 10), at) padded at the start to 10 characters with U+00A0; pair = full.slice(at, at + 2); after = full.slice(at + 2, at + 12) padded at the end to 10 characters with U+00A0. This produces ten characters on each side of the selected pair, which keeps it at the exact centre. At position 0 the strip is eight U+00A0, “3.”, the pair “14”, then “1592653589”.
- On change, store Number(event.target.value). Preserve native range keyboard behavior, including its step of 1. Nothing animates.

STYLING
- Colors are given as light-dark(light, dark) pairs and resolve against the page's color-scheme; if the host page does not set one, set color-scheme: light dark on :root.
- The specimen is width 100%, max-width 310px, centered, color light-dark(#282824, #e8e7e0).
- The track group begins at the top of the specimen. The digit strip sits above the range with 10px bottom margin. The range is 100% wide and 28px tall with no margin or padding, transparent background, no native appearance, cursor ew-resize, and 5px outline offset.
- The track is 2px high with background light-dark(#c6c8ba, #4a4b43). The WebKit thumb is 14px by 26px with margin-top -12px, 4px solid light-dark(#ffffff, #1a1a17) border, 3px radius, 1px solid light-dark(#c6c8ba, #4a4b43) outline, and light-dark(#899176, #717b5f) fill. The Firefox thumb is 6px by 18px with the same border, radius, outline, and fill.
- The range focus-visible outline is 2px solid light-dark(#667251, #8e9c78) with 2px radius.
- The strip is a full-width grid with columns minmax(0, 1fr), auto, minmax(0, 1fr), aligning the mark to the exact horizontal centre regardless of its surrounding digits. It has a 10px bottom margin, no other margin, light-dark(#6b6b63, #9c9c91) color, 13px sans-serif, 4px letter-spacing, white-space pre, and tabular numerals. The before span is right aligned and the after span is left aligned with 4px left padding; both hide overflow. The mark is inline-block with a 4px right margin, 4px 2px 4px 6px padding (the extra left padding balances the trailing letter-spacing), 3px radius, light-dark(#e6e9dc, #2b3125) background, light-dark(#54614a, #b6c2a2) color, 17px bold type at line-height 1, an inset 1px light-dark(#667251, #8e9c78) outline, and no transform.

DONE WHEN
- The slider starts with 14 selected, and each step selects the next overlapping pair of π's decimal digits.
- The strip stays above the track and keeps the selected pair centred.
- aria-valuetext always matches the selected pair.
`;
