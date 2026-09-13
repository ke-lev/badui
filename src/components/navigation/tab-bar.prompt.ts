export const tabBarPrompt = `WHAT TO BUILD
Build a portable React + TypeScript tab set named TabBar. It takes no props and is used as <TabBar />. Keep the component and its plain CSS self-contained, with no application-specific imports.

Reproduce the behavior exactly as specified; do not adjust thresholds, timings, or interaction.

MARKUP AND SEMANTICS
- Render one bordered container holding a div with role="tablist" and aria-label="Workspace", followed by a single div with role="tabpanel".
- The tablist holds five native type="button" elements with role="tab", one per tab: “Overview”, “Activity”, “Members”, “Billing”, “Settings”. Give each an id derived from a useId base and the tab name.
- Each tab has aria-selected true or false. Only the selected tab has aria-controls (the panel id) and tabIndex 0; every other tab has tabIndex -1.
- The panel has an id, aria-labelledby pointing at the selected tab's id, and tabIndex 0. It contains two paragraphs: the selected tab's name as a title, and its description.
- Descriptions: Overview “A summary of the workspace and its most recent changes.”; Activity “Every change, newest first.”; Members “Four people have access to this workspace.”; Billing “The next invoice is issued on the first of the month.”; Settings “Workspace name, region, and retention period.”

BEHAVIOR
- Keep two pieces of state: the tab order, initially Overview, Activity, Members, Billing, Settings; and the selected tab, initially Overview. The initial selection does not reorder anything.
- Selecting a tab (click, or Enter or Space on the focused tab through native button activation) sets it as selected and moves it to the end of the order. The remaining tabs keep their relative order. Selecting the tab already at the end changes nothing about the order.
- Render the tabs in the current order, keyed by name. Because reordering moves the selected tab's DOM node, which drops focus, record the selected tab before reordering and focus it again in a layout effect that runs after the order changes.
- Activation is manual. On keydown inside the tablist, locate the focused tab in the current order. ArrowRight focuses the next tab, wrapping to the first; ArrowLeft focuses the previous, wrapping to the last; Home focuses the first; End focuses the last. Call preventDefault for these four keys. Moving focus never selects a tab.
- No animation is used for reordering.

STYLING
- The container is width 100%, max-width 360px, centered, 1px solid #deded6 border, 6px radius, white background, color #282824.
- The tablist is a flex row with 2px gap, 4px padding, a 1px solid #deded6 bottom border, and horizontal overflow auto.
- Each tab is flex 0 0 auto, min-height 34px, padding 6px 9px, no border, 4px radius, transparent background, color #6b6b63, 12px inherited sans-serif, pointer cursor, with 120ms ease transitions on background and color. Hover uses #f3f3ec and #282824. The selected tab uses #ecece4, #282824, and font-weight 500.
- The panel has min-height 118px and padding 18px 16px. The title is 17px, weight 500, letter-spacing -0.4px, margin 0 0 6px. The description is 12px, line-height 1.6, color #6b6b63, margin 0.
- Tabs and panel use a 2px solid #667251 focus-visible outline at 2px offset. Remove transitions under prefers-reduced-motion: reduce.

DONE WHEN
- Selecting any tab shows its panel and places that tab last, with the others shifting left in order.
- Focus remains on the selected tab after it moves, and arrow keys, Home, and End move focus through the current order without selecting.
- Roles, aria-selected, roving tabIndex, aria-controls, and aria-labelledby match the specification.
`;
