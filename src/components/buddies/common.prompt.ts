// Passages shared by the companion prompts. Each prompt interpolates these into
// one self-contained string, so a change here reaches every prompt at once.

export const SPRING = `A spring is { value, velocity }. Advance one toward a target with semi-implicit Euler in substeps of at most 1/240 second: acceleration = stiffness * (target - value) - damping * velocity; velocity += acceleration * h; value += velocity * h. After stepping, if |target - value| < 0.05 and |velocity| < 0.5, set value to target and velocity to 0. For a damping ratio, damping = 2 * ratio * sqrt(stiffness).`;

export const ENVELOPE_BEHAVIOR = `- The envelope is four springs, x, y, width, and height, in pixels from the area's top-left corner. ${SPRING}
- Idle, the envelope's target is a 24px square centred on the point it follows, with stiffness 190 and ratio 1. Locked onto an element, its target is that element's bounding box relative to the area, grown by 6px on every side, with stiffness 1100 and ratio 0.7.
- When the pointer enters the area, set all four springs to the idle target with zero velocity.
- Paint the envelope each frame: width and height from the springs; transform translate3d(x px, y px, 0); border-radius 11px when locked, otherwise half the smaller of width and height.
- Under prefers-reduced-motion (read once on mount), set every spring directly to its target each frame.`;

export const TAB_BEHAVIOR = `- The tab sits 9px below the envelope. If its bottom would come within 4px of the area's bottom edge, place it 9px above the envelope instead. Its left edge matches the envelope's, clamped to stay at least 4px inside the area's left and right edges. Position it with transform translate3d.`;

export const SPECIMEN_STYLING = `- Colors are given as light-dark(light, dark) pairs and resolve against the page's color-scheme; if the host page does not set one, set color-scheme: light dark on :root.
- The specimen is a vertical flex column that grows to fill its container (flex: 1, align-self: stretch), 12px gap, min-width 0, color light-dark(#282824, #e8e7e0).
- The area is position relative, flex 1, min-height 160px, touch-action manipulation.`;

export const BUTTON_STYLING = `inline-flex centred; min-height 39px; padding 8px 16px; 1px solid transparent border; 5px radius; background light-dark(#30312b, #e8e7e0); text light-dark(#fafaf6, #1a1a17); inherited sans-serif font at 12px, weight 500, line-height 1.5; nowrap; cursor pointer; transition background 150ms ease. Focus-visible outline is 2px solid light-dark(#667251, #8e9c78) with 3px offset`;

export const ENVELOPE_STYLING = `- The layer is absolutely positioned to fill the area with pointer-events none.
- The envelope is absolutely positioned at top 0, left 0, initially 24px square with a 12px radius, opacity 0, transition opacity 150ms ease and border-radius 160ms ease, will-change transform. While shown its opacity is 1.`;

export const TAB_STYLING = `- The tab is absolutely positioned at top 0, left 0; padding 5px 9px; 5px radius; sans-serif 11px, line-height 1.45; nowrap; opacity 0 with transition opacity 150ms ease. While shown its opacity is 1.`;

export const ARROW_MARKUP = `- The drawn pointer is a div with aria-hidden="true" holding an inline SVG, viewBox "0 0 16 22", width 16, height 22, with one path: d="M1.5 1.5v16.2l4.3-4.1 2.9 6.6 2.6-1.1-2.9-6.5h6z", fill light-dark(#282824, #e8e7e0), stroke light-dark(#fafaf6, #1a1a17), stroke-width 1.25, stroke-linejoin round.`;

export const ARROW_STYLING = `- The drawn pointer div is absolutely positioned at top -1.5px, left -1.5px, 16px by 22px, visibility hidden initially, pointer-events none, will-change transform. The SVG is display block.`;

export const READOUT_STYLING = `- The readout is a flex row with space-between, margin 0, 11px, color light-dark(#6b6b63, #9c9c91). Count spans are light-dark(#282824, #e8e7e0) in a monospace stack with tabular numerals.`;
