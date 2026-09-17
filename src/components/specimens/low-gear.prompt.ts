export const lowGearPrompt = `WHAT TO BUILD
Build a portable React + TypeScript rotary volume control named LowGear. It takes no props and is used as <LowGear />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render a centered specimen containing one 224-by-224-pixel circular dial and a hint reading “Turn to adjust” with a small decorative turn-arrow icon.
- Make the dial a focusable div with role="slider", aria-label="Volume", aria-valuemin=0, aria-valuemax=100, aria-valuenow equal to the displayed integer, and aria-valuetext="N percent".
- Inside the dial, render an aria-hidden SVG with viewBox "0 0 224 224" and 48 radial tick lines. For tick index i, angle is i * Math.PI / 24, inner radius is 97 when i is divisible by 4 and 101 otherwise, and outer radius is 107; center all coordinates on 112 and format them to three decimals.
- Add a circular face, a decorative hand, and a centered reading with the integer percent above the label “Volume”.

BEHAVIOR
- Store rotation in degrees, initially 0, and clamp it from 0 through MAX_ROTATION = 4500.
- Display Math.round(rotation / 45), producing values from 0 through 100. One full turn therefore changes the displayed value by 8 percent and the full range takes 12.5 turns.
- On a primary-button pointer down only, capture the pointer, focus the dial without scrolling, record the pointer angle around the dial center using Math.atan2 in degrees, and enter a dragging state.
- During captured pointer movement, subtract the previous angle from the next angle. If the difference is greater than 180, subtract 360; if it is less than -180, add 360. Add that normalized difference to rotation and clamp it. Update the previous angle after every move.
- On pointer up, pointer cancel, or lost pointer capture, clear the previous angle and dragging state.
- ArrowRight and ArrowUp add exactly 45 degrees; ArrowLeft and ArrowDown subtract exactly 45 degrees. Prevent default only for those four keys. Do not add Home, End, PageUp, or PageDown handling.

STYLING
- Colors are given as light-dark(light, dark) pairs and resolve against the page's color-scheme; if the host page does not set one, set color-scheme: light dark on :root.
- The specimen is width 100%, max-width 320px, centered, color light-dark(#282824, #e8e7e0), and a vertical flex layout aligned center with a 15px gap.
- The dial is position relative, 224px square, circular, touch-action none, user-select none, cursor grab, and cursor grabbing while dragged. Its focus-visible outline is 2px solid light-dark(#6c7660, #8e9c78) with 7px offset.
- Major ticks use stroke light-dark(#9d9d92, #62635a) at width 1; minor ticks use light-dark(#d4d4c9, #4a4b43) at width 1.
- Inset the face by 29px; give it a 1px solid light-dark(#deded6, #34342f) border and light-dark(#ffffff, #1a1a17) background. Inset the hand by 10px. Its marker is 4px by 12px, top 2px, centered horizontally, radius 2px, background light-dark(#858e70, #717b5f).
- Use a 42px normal-weight sans-serif reading with line-height 1.1, letter-spacing -3px, tabular numerals. Position the 13px light-dark(#77776b, #9c9c91) percent sign at top 8px with 4px left margin. Use 11px light-dark(#6b6b63, #9c9c91) for the label and hint.
- At widths up to 600px, make the dial 210px square and inset the face by 28px.

DONE WHEN
- Pointer turning remains continuous across the -180/180-degree seam and clamps at 0 and 4500 degrees.
- Keyboard presses move exactly one displayed percent and all slider names, values, and states are exposed.
- The 48 ticks, hand, reading, focus treatment, drag cursor, hint, and mobile size match the specification.
`;
