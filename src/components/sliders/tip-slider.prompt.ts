import { PI_DIGITS } from "./pi-digits";

export const tipSliderPrompt = `WHAT TO BUILD
Build a portable React + TypeScript tip slider named TipSlider. It takes no props and is used as <TipSlider />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a heading row with a label reading “Tip” on the left and a span reading “Bill $48.00” on the right.
- Generate a stable input id with useId and connect the label to a native input type="range" with min=0, max=604, step=1, and a controlled numeric position starting at 0.
- Above the range, render a reading row: on the left an output connected to the range with htmlFor, set to aria-live="off", showing the percentage followed by “%”, e.g. “14%”; on the right a span showing the tip amount, e.g. “$6.72”.
- Set the range's aria-valuetext to the percentage followed by “ percent”, e.g. “14 percent”.
- Beneath the range, render an aria-hidden paragraph holding the digit strip: the text before the pair, a mark element holding the pair, and the text after it.

BEHAVIOR
- Define DIGITS as exactly this 606-character string, the first 606 decimal digits of π:
${PI_DIGITS}
- The percentage at a position is Number(DIGITS.slice(position, position + 2)). Position 0 reads 14, position 604 is the last, and every value from 0 to 99 occurs somewhere in positions 0 through 604.
- The tip amount is (48 * percentage / 100).toFixed(2) with a leading “$”.
- For the strip, let full = "3." + DIGITS and at = position + 2. before = full.slice(Math.max(0, at − 7), at) padded at the start to 7 characters with U+00A0; pair = full.slice(at, at + 2); after = full.slice(at + 2, at + 9) padded at the end to 7 characters with U+00A0. At position 0 the strip is five U+00A0, “3.”, the pair “14”, then “1592653”.
- On change, store Number(event.target.value). Preserve native range keyboard behavior, including its step of 1. Nothing animates.

STYLING
- Colors are given as light-dark(light, dark) pairs and resolve against the page's color-scheme; if the host page does not set one, set color-scheme: light dark on :root.
- The specimen is width 100%, max-width 310px, centered, color light-dark(#282824, #e8e7e0).
- The heading is a 12px flex row with 20px line-height, items centered, spaced apart, 12px gap. The “Bill” span is light-dark(#6b6b63, #9c9c91), 11px monospace, normal letter-spacing, tabular numerals.
- The reading row is a flex row with items on the baseline, spaced apart, 12px gap, no margin, 24px top and 21px bottom padding, a 1px solid light-dark(#deded6, #34342f) bottom border, nowrap, tabular numerals, and a monospace stack. Its font size is clamp(25px, 2.8vw, 32px), line-height 1.3, letter-spacing -1.5px. The amount span is light-dark(#6b6b63, #9c9c91), 13px monospace, normal letter-spacing.
- Put the track group 31px below the reading. The range is 100% wide and 28px tall with no margin or padding, transparent background, no native appearance, cursor ew-resize, and 5px outline offset.
- The track is 2px high with background light-dark(#c6c8ba, #4a4b43). The WebKit thumb is 14px by 26px with margin-top -12px, 4px solid light-dark(#ffffff, #1a1a17) border, 3px radius, 1px solid light-dark(#c6c8ba, #4a4b43) outline, and light-dark(#899176, #717b5f) fill. The Firefox thumb is 6px by 18px with the same border, radius, outline, and fill.
- The range focus-visible outline is 2px solid light-dark(#667251, #8e9c78) with 2px radius.
- The strip has a 10px top margin, no other margin, light-dark(#6b6b63, #9c9c91) color, 12px monospace, 2px letter-spacing, centred text, white-space pre, and tabular numerals. The mark has padding 1px 0 1px 2px, 2px radius, background light-dark(#e6e9dc, #2b3125), and color light-dark(#54614a, #b6c2a2).
- At widths up to 600px, the reading row uses clamp(24px, 7vw, 30px).

DONE WHEN
- The slider starts at 14% and $6.72, and each step shows the next overlapping pair of π's decimal digits.
- Every percentage from 0 to 99 is reachable within the 605 positions.
- The strip keeps the current pair centred, and aria-valuetext always matches the visible percentage.
`;
