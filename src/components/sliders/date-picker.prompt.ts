export const datePickerPrompt = `WHAT TO BUILD
Build a portable React + TypeScript date-of-birth slider named DatePicker. It takes no props and is used as <DatePicker />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a heading row with a label reading “Date of birth” and a decorative aria-hidden calendar icon.
- Generate a stable input id with useId and connect the label to a native input type="range".
- Render an output above the track, connected to the input with htmlFor and set to aria-live="off".
- Give the range min=0, max=46385, step=1, its controlled numeric value, and aria-valuetext equal to the formatted date.
- Beneath the range, render an aria-hidden row of 27 ticks, marking each even-indexed tick as major, and aria-hidden endpoint labels “1900” and “2026”.

BEHAVIOR
- Define DAY = 86400000 and FIRST_DATE = Date.UTC(1900, 0, 1).
- The maximum day index is exactly 46385, representing 31 December 2026. The initial day index is exactly 35195, representing 12 May 1996.
- On change, store Number(event.target.value).
- Construct the selected date from FIRST_DATE + day * DAY and read every field with UTC getters.
- Format it exactly as a two-digit day, one space, an uppercase three-letter month from JAN through DEC, one space, and the four-digit year; the initial reading is “12 MAY 1996”.
- Preserve native range keyboard behavior, including its one-day step.

STYLING
- Colors are given as light-dark(light, dark) pairs and resolve against the page's color-scheme; if the host page does not set one, set color-scheme: light dark on :root.
- The specimen is width 100%, max-width 310px, centered, color light-dark(#282824, #e8e7e0).
- The heading is a 12px flex row with 20px line-height, items centered and spaced apart; the icon is light-dark(#838377, #75756b).
- The output is block-level with 24px top and 21px bottom padding, a 1px solid light-dark(#deded6, #34342f) bottom border, nowrap, tabular numerals, and a monospace stack. Its font size is clamp(25px, 2.8vw, 32px), line-height 1.3, letter-spacing -1.5px.
- Put the track group 31px below the output. The range is 100% wide and 28px tall with no margin or padding, transparent background, no native appearance, cursor ew-resize, and 5px outline offset.
- The track is 2px high with background light-dark(#c7c7bc, #4a4b43). The WebKit thumb is 14px by 26px with margin-top -12px, 4px solid light-dark(#ffffff, #1a1a17) border, 3px radius, 1px light-dark(#b9bbae, #4a4b43) outline, and light-dark(#879271, #717b5f) fill. The Firefox thumb is 6px by 18px with the same border, radius, outline, and fill.
- The range focus-visible outline is 2px solid light-dark(#6c7660, #8e9c78) with 2px radius. Ticks sit in a 12px-high flex row with 6px horizontal margins: each is 1px by 4px in light-dark(#d2d2c6, #4a4b43) and majors are 7px high. Endpoint labels are spaced apart, 7px above margin, 10px monospace, color light-dark(#6b6b63, #9c9c91).
- At widths up to 600px, use clamp(24px, 7vw, 30px) for the reading.

DONE WHEN
- The native slider spans every UTC day from 1 January 1900 through 31 December 2026 and starts on 12 May 1996.
- The visible output and aria-valuetext always carry the same exact formatted date.
- Labels, ticks, endpoint years, focus state, and mobile typography match the specification.
`;
