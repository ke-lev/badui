export const brightnessPrompt = `WHAT TO BUILD
Build a portable React + TypeScript brightness slider named Brightness. It takes no props and is used as <Brightness />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a heading row with a label reading “Brightness” and a decorative aria-hidden sun icon: a 17px SVG with a 20 by 20 viewBox, a circle of radius 3.5 at its centre, and the path “M10 1.75v2M10 16.25v2M1.75 10h2M16.25 10h2M4.17 4.17l1.41 1.41M14.42 14.42l1.41 1.41M4.17 15.83l1.41-1.41M14.42 5.58l1.41-1.41”, both stroked in currentColor at 1.25 with no fill.
- Generate a stable input id with useId and connect the label to a native input type="range" with min=0, max=100, step=1, and a controlled numeric value starting at 60.
- Above the range, render an output connected to it with htmlFor and set to aria-live="off". It shows the written equation for the current value, with every letter x wrapped in its own var element.
- Set the range's aria-valuetext to the spoken equation. aria-valuenow stays the native numeric value.
- Beneath the range, render aria-hidden endpoint labels “0” and “100”.

BEHAVIOR
- On change, store Number(event.target.value) as x.
- Derive four integers from x: a = 3 + ((x * 5) % 7); c = a − 1 − ((x * 3) % (a − 1)); b = ((x * 11) % 19) − 9; d = (a − c) * x + b. The equation a·x + b = c·x + d has exactly one solution, which is x.
- Write each side from its coefficient and constant. The term is “x” when the coefficient is 1, and otherwise the coefficient followed directly by “x”, e.g. “9x”. When the constant is 0 the side is the term alone; otherwise it is the term, a space, a sign, a space, and the constant's absolute value.
- The written equation uses “+” for a positive constant and “−” (U+2212) for a negative one, and joins the sides with “ = ”. At 60 it reads “9x + 5 = 4x + 305”; at 0 it reads “3x − 9 = 2x − 9”.
- The spoken equation uses “plus” and “minus” as the signs and joins the sides with “ equals ”, e.g. “9x plus 5 equals 4x plus 305”.
- Preserve native range keyboard behavior, including its step of 1. Nothing animates.

STYLING
- Colors are given as light-dark(light, dark) pairs and resolve against the page's color-scheme; if the host page does not set one, set color-scheme: light dark on :root.
- The specimen is width 100%, max-width 310px, centered, color light-dark(#282824, #e8e7e0).
- The heading is a 12px flex row with 20px line-height, items centered, spaced apart, 12px gap; the icon is light-dark(#8c8c80, #75756b).
- The output is block-level with no margin, 24px top and 21px bottom padding, a 1px solid light-dark(#deded6, #34342f) bottom border, nowrap, tabular numerals, and a monospace stack at 24px, line-height 1.3, letter-spacing -1px. Each var is italic and light-dark(#54614a, #b6c2a2).
- Put the track group 31px below the output. The range is 100% wide and 28px tall with no margin or padding, transparent background, no native appearance, cursor ew-resize, and 5px outline offset.
- The track is 2px high with background light-dark(#c6c8ba, #4a4b43). The WebKit thumb is 14px by 26px with margin-top -12px, 4px solid light-dark(#ffffff, #1a1a17) border, 3px radius, 1px solid light-dark(#c6c8ba, #4a4b43) outline, and light-dark(#899176, #717b5f) fill. The Firefox thumb is 6px by 18px with the same border, radius, outline, and fill.
- The range focus-visible outline is 2px solid light-dark(#667251, #8e9c78) with 2px radius.
- Endpoint labels are a flex row spaced apart, 7px top margin, 10px monospace, color light-dark(#6b6b63, #9c9c91).
- At widths up to 600px, the output uses clamp(20px, 6vw, 24px).

DONE WHEN
- The output reads “9x + 5 = 4x + 305” on load and a different equation at every step, each solved by the slider's value.
- A coefficient of 1 is written as “x”, a constant of 0 is omitted, and negative constants use U+2212.
- aria-valuenow carries the number and aria-valuetext carries the spoken equation.
`;
