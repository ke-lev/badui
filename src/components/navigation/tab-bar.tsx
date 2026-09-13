"use client";

import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import type { ComponentMeta } from "@/components/meta";
import { moveToEnd } from "./rules";
import { tabBarPrompt } from "./tab-bar.prompt";
import styles from "./navigation.module.css";

const TABS = ["Overview", "Activity", "Members", "Billing", "Settings"] as const;
type Tab = (typeof TABS)[number];

const PANELS: Record<Tab, string> = {
  Overview: "A summary of the workspace and its most recent changes.",
  Activity: "Every change, newest first.",
  Members: "Four people have access to this workspace.",
  Billing: "The next invoice is issued on the first of the month.",
  Settings: "Workspace name, region, and retention period.",
};

export function TabBar() {
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const [order, setOrder] = useState<Tab[]>([...TABS]);
  const [selected, setSelected] = useState<Tab>("Overview");
  const tabs = useRef(new Map<Tab, HTMLButtonElement>());
  // Reordering moves the selected tab's node, which drops focus; put it back.
  const refocus = useRef<Tab | null>(null);

  useLayoutEffect(() => {
    if (!refocus.current) return;
    tabs.current.get(refocus.current)?.focus();
    refocus.current = null;
  }, [order]);

  function select(tab: Tab) {
    refocus.current = tab;
    setSelected(tab);
    setOrder((current) => moveToEnd(current, tab));
  }

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    const index = order.findIndex((tab) => tabs.current.get(tab) === event.target);
    if (index < 0) return;
    let target: number;
    if (event.key === "ArrowRight") target = (index + 1) % order.length;
    else if (event.key === "ArrowLeft") target = (index - 1 + order.length) % order.length;
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = order.length - 1;
    else return;
    event.preventDefault();
    tabs.current.get(order[target])?.focus();
  }

  return (
    <div className={`${styles.specimen} ${styles.tabsSpecimen} ${styles.surface}`}>
      <div className={styles.tablist} role="tablist" aria-label="Workspace" onKeyDown={handleKey}>
        {order.map((tab) => {
          const isSelected = tab === selected;
          return (
            <button
              key={tab}
              ref={(node) => {
                if (node) tabs.current.set(tab, node);
                else tabs.current.delete(tab);
              }}
              type="button"
              role="tab"
              id={`${baseId}-${tab}`}
              className={styles.tab}
              data-sidekick="tab"
              aria-selected={isSelected}
              aria-controls={isSelected ? panelId : undefined}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => select(tab)}
            >
              {tab}
            </button>
          );
        })}
      </div>
      <div
        className={styles.panel}
        role="tabpanel"
        id={panelId}
        aria-labelledby={`${baseId}-${selected}`}
        tabIndex={0}
      >
        <p className={styles.panelTitle}>{selected}</p>
        <p className={styles.panelText}>{PANELS[selected]}</p>
      </div>
    </div>
  );
}

export const tabBarMeta: ComponentMeta = {
  name: "Tabs",
  kind: "hostile",
  category: "navigation",
  summary:
    "Five tabs over one panel. Selecting a tab shows its panel and moves the " +
    "tab to the end of the row; the tabs after it each shift one place left.",
  usage: "<TabBar />",
  prompt: tabBarPrompt,
  notes:
    "A role=tablist with manual activation: ArrowLeft, ArrowRight, Home, and " +
    "End move focus in the current order, and Enter, Space, or a click " +
    "selects. Only the selected tab is in the tab sequence, and focus stays " +
    "on it after it moves.",
  lines: {
    tab: "The one you choose goes to the back of the line.",
  },
};
