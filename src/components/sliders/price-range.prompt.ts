export const priceRangePrompt = `WHAT TO BUILD
Build a portable React + TypeScript two-thumb price filter named PriceRange. It takes no props and is used as <PriceRange />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- The root is a div with role="group" and aria-labelledby pointing at a heading span reading “Price”, whose id comes from useId. The heading row has that span on the left and a span reading “USD” on the right.
- Below it, a reading paragraph holding an output for the minimum (e.g. “$80”), an aria-hidden span reading “ – ” (spaces around an en dash), and an output for the maximum (e.g. “$320”). Each output is connected with htmlFor to its input and set to aria-live="off".
- Below that, a track group holding a position-relative container with, in order: an aria-hidden rail span; an aria-hidden lane span holding a fill span; the minimum input; the maximum input.
- Both inputs are native type="range" with stable ids from useId, min=0, max=500, step=10, and controlled numeric values. The minimum has aria-label “Minimum price” and the maximum “Maximum price”; each has aria-valuetext of “$” followed by its value.
- Beneath the container, aria-hidden endpoint labels “$0” and “$500”.

BEHAVIOR
- The minimum starts at 80 and the maximum at 320.
- On minimum change, set it to Math.min(Number(event.target.value), maximum − 10). On maximum change, set it to Math.max(Number(event.target.value), minimum + 10). The thumbs never cross and stay at least one step apart.
- The fill's left is minimum / 500 × 100% and its right is 100 − maximum / 500 × 100 percent.
- When the minimum is above 250, the minimum input has z-index 2 and the maximum 1; otherwise the minimum has 1 and the maximum 2.
- Preserve native keyboard behavior on both inputs, including arrow keys, Page Up, Page Down, Home, and End. Nothing animates.

STYLING
- Colors are given as light-dark(light, dark) pairs and resolve against the page's color-scheme; if the host page does not set one, set color-scheme: light dark on :root.
- The specimen is width 100%, max-width 310px, centered, color light-dark(#282824, #e8e7e0).
- The heading is a 12px flex row with 20px line-height, items centered, spaced apart, 12px gap. The “USD” span is light-dark(#6b6b63, #9c9c91), 11px monospace, normal letter-spacing, tabular numerals.
- The reading paragraph is block-level with no margin, 24px top and 21px bottom padding, a 1px solid light-dark(#deded6, #34342f) bottom border, nowrap, tabular numerals, and a monospace stack. Its font size is clamp(25px, 2.8vw, 32px), line-height 1.3, letter-spacing -1.5px. The dash is light-dark(#6b6b63, #9c9c91).
- Put the track group 31px below the reading. The container is 28px tall.
- The rail is absolute, spanning the full width, 13px from the top, 2px high, light-dark(#c6c8ba, #4a4b43). The lane is absolute with inset 0 7px and pointer-events none. The fill is absolute, 13px from the top, 2px high, light-dark(#54614a, #b6c2a2).
- Each input is absolute with inset 0, 100% wide and 28px tall, no margin or padding, transparent background, no native appearance, and pointer-events none. Its track is 2px high and transparent. The WebKit thumb is 14px by 26px with margin-top -12px, 4px solid light-dark(#ffffff, #1a1a17) border, 3px radius, 1px solid light-dark(#c6c8ba, #4a4b43) outline, light-dark(#899176, #717b5f) fill, cursor grab, and pointer-events auto. The Firefox thumb is 6px by 18px with the same border, radius, outline, fill, cursor, and pointer-events.
- On focus-visible the input itself has no outline; its thumb's outline becomes 2px solid light-dark(#667251, #8e9c78).
- Endpoint labels are a flex row spaced apart, 7px top margin, 10px monospace, color light-dark(#6b6b63, #9c9c91).
- At widths up to 600px, the reading uses clamp(24px, 7vw, 30px).

DONE WHEN
- The filter starts at $80 – $320 with the span between the thumbs filled.
- Neither thumb can pass the other or come within $10 of it, by pointer or keyboard.
- Both thumbs stay grabbable when they meet at either end, only the thumbs respond to the pointer, and the focused thumb shows the focus outline.
`;
