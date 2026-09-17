export const recursionPrompt = `WHAT TO BUILD
Build a portable React + TypeScript inline confirmation sequence named Recursion. It takes no props and is used as <Recursion />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Start with one inline panel carrying role="dialog", aria-modal="false", and aria-labelledby pointing to a useId-generated title id.
- Include an icon-only close button with type="button", aria-label="Close confirmation", and an aria-hidden X icon.
- Show an uppercase counter “Confirmation NN” in an aria-live="polite" element, where NN is the depth padded to two digits.
- The title is “Are you sure?” and the message is a second aria-live="polite" element.
- Add secondary “Cancel” and primary “Continue ↗” buttons; hide the arrow glyph from assistive technology.
- When the sequence is canceled, replace the dialog with a success-style panel containing role="status" text “Action canceled.” and a “Continue” button.

BEHAVIOR
- Store depth, initially 1, with no upper bound.
- Use these six messages in this exact cycle: “Would you like to continue?”, “Please confirm your confirmation.”, “Are you sure you were sure?”, “This will confirm the previous confirmation.”, “One more confirmation is required.”, “Your confirmation needs confirmation.”
- Select message index (depth - 1) modulo 6.
- Both the close button and the primary Continue button increment depth by 1. Cancel decrements depth by 1.
- Depth 0 shows the canceled panel. Its Continue button sets depth back to 1.
- Set a layer indicator to Math.min(depth - 1, 2): no backing cards at depth 1, one at depth 2, and two at every depth of 3 or more.
- Do not add modal focus trapping, Escape handling, automatic focus movement, or a portal; this remains inline and nonmodal.

STYLING
- Colors are given as light-dark(light, dark) pairs and resolve against the page's color-scheme; if the host page does not set one, set color-scheme: light dark on :root.
- The stack is position relative, isolated, width calc(100% - 12px), max-width 304px, color light-dark(#282824, #e8e7e0).
- Draw two absolute backing cards behind it, each inset 0 with 1px solid light-dark(#d8d8d0, #34342f) border and 7px radius. The first uses light-dark(#f6f6f1, #1d1d1a) and translate(6px, -6px); the second uses light-dark(#eeeee7, #2d2d28) and translate(12px, -12px). Hide both for layer 0 and hide the second for layer 1. Fade opacity over 160ms ease.
- The dialog has padding 26px 23px 22px, 1px solid light-dark(#deded6, #34342f) border, 7px radius, light-dark(#ffffff, #1a1a17) background, and 0 5px 12px light-dark(rgba(40,40,36,0.03), rgba(0,0,0,0.15)) shadow.
- Position the close control top 13px and right 12px, 27px square, no border, 3px radius, transparent background, light-dark(#82827a, #75756b); hover uses light-dark(#f3f3ec, #1d1d1a) and light-dark(#282824, #e8e7e0).
- The counter has margin 0 20px 16px 0, 10px sans-serif, line-height 1.5, letter-spacing 0.07em, uppercase, color light-dark(#6b6b63, #9c9c91). The title is 21px medium, line-height 1.2, tracking -0.7px, margin bottom 9px. The message has min-height 42px, margin bottom 22px, 12px type, line-height 1.6, color light-dark(#6b6b63, #9c9c91).
- Actions use a two-column equal grid with 9px gap. Buttons have min-height 39px, 8px 10px padding, 5px radius, 12px medium type. Primary is light-dark(#30312b, #e8e7e0) on light-dark(#fafaf6, #1a1a17); secondary is light-dark(#464640, #c3c3b9) on light-dark(#ffffff, #1a1a17) with light-dark(#ddddd5, #34342f) border. Preserve hover, active translateY(1px), and 2px light-dark(#667251, #8e9c78) focus outlines at 3px offset.
- The canceled panel is centered, width 100%, vertical with 18px gap; its title is 18px medium with -0.5px tracking. Remove transitions under reduced motion.

DONE WHEN
- Continue and close always advance, Cancel backs up exactly one level, and only canceling depth 1 reaches the canceled panel.
- Counter, six-message cycle, maximum of two backing cards, roles, labels, and live regions match the specification.
- The inline panel remains visibly and semantically nonmodal.
`;
