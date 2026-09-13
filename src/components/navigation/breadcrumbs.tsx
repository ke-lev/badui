"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentMeta } from "@/components/meta";
import { breadcrumbsPrompt } from "./breadcrumbs.prompt";
import { visibleCrumbs } from "./rules";
import styles from "./navigation.module.css";

type Folder = { [name: string]: Folder };

const TREE: Folder = {
  Documents: {
    Invoices: { "2025": {}, "2026": {} },
    Letters: { Drafts: {}, Sent: {} },
  },
  Photos: {
    "2025": { Spring: {}, Autumn: {} },
    "2026": { Summer: { Coast: {}, City: {} }, Winter: {} },
  },
  Music: {},
};

const ROOT = "Home";
const INITIAL_PATH = [ROOT, "Photos", "2026", "Summer", "Coast"];

function foldersIn(path: string[]): string[] {
  let folder = TREE;
  for (const name of path.slice(1)) folder = folder[name];
  return Object.keys(folder);
}

function FolderIcon() {
  return (
    <svg className={styles.folderIcon} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2.6l1.5 1.5h4.9A1.5 1.5 0 0 1 14 6v5.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 11.5v-7Z" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function Breadcrumbs() {
  const [path, setPath] = useState(INITIAL_PATH);
  const [expanded, setExpanded] = useState(false);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const crumbs = useRef(new Map<number, HTMLButtonElement>());
  const pendingFocus = useRef<"title" | "crumb" | null>(null);
  const folders = foldersIn(path);
  const current = path[path.length - 1];

  useEffect(() => {
    const target = pendingFocus.current;
    pendingFocus.current = null;
    if (target === "title") titleRef.current?.focus();
    else if (target === "crumb") crumbs.current.get(1)?.focus();
  }, [path, expanded]);

  function go(next: string[]) {
    pendingFocus.current = "title";
    setPath(next);
    setExpanded(false);
  }

  function expand() {
    pendingFocus.current = "crumb";
    setExpanded(true);
  }

  return (
    <div className={styles.specimen}>
      <nav aria-label="Breadcrumb">
        <ol className={styles.trail}>
          {visibleCrumbs(path.length, expanded).map((index, position) => (
            <li key={index ?? "more"}>
              {position > 0 && <span className={styles.separator} aria-hidden="true">/</span>}
              {index === null ? (
                <button
                  type="button"
                  className={styles.crumbButton}
                  data-sidekick="breadcrumb-more"
                  aria-label={`Show ${path.length - 3} hidden folders`}
                  aria-expanded={false}
                  onClick={expand}
                >
                  …
                </button>
              ) : index === path.length - 1 ? (
                <span className={styles.crumbCurrent} aria-current="page">{path[index]}</span>
              ) : (
                <button
                  type="button"
                  ref={(node) => {
                    if (node) crumbs.current.set(index, node);
                    else crumbs.current.delete(index);
                  }}
                  className={styles.crumbButton}
                  data-sidekick="breadcrumb"
                  onClick={() => go(path.slice(0, index + 1))}
                >
                  {path[index]}
                </button>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <div className={styles.folderHead}>
        <p className={styles.folderTitle} tabIndex={-1} ref={titleRef}>{current}</p>
        <p className={styles.caption}>
          {folders.length === 1 ? "1 folder" : `${folders.length} folders`}
        </p>
      </div>
      {folders.length === 0 ? (
        <div className={styles.folders}>
          <p className={styles.empty}>This folder is empty.</p>
        </div>
      ) : (
        <ul className={styles.folders} aria-label={`Folders in ${current}`}>
          {folders.map((name) => (
            <li key={name}>
              <button
                type="button"
                className={styles.folderButton}
                data-sidekick="folder"
                onClick={() => go([...path, name])}
              >
                <FolderIcon />
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const breadcrumbsMeta: ComponentMeta = {
  name: "Breadcrumbs",
  kind: "benign",
  category: "navigation",
  summary:
    "A folder browser with a breadcrumb trail. Each crumb returns to that " +
    "folder; past four crumbs, the middle folds into a single button that " +
    "restores it. Folders below the trail open one level down.",
  usage: "<Breadcrumbs />",
  prompt: breadcrumbsPrompt,
  notes:
    "The trail is an ordered list in a nav labelled Breadcrumb, with the " +
    "current folder as plain text marked aria-current=page. After any " +
    "navigation, focus moves to the folder's title; unfolding the trail moves " +
    "focus to the first folder it revealed.",
  lines: {
    breadcrumb: "Back to here, and everything below it.",
    "breadcrumb-more": "The middle of the trail, folded.",
    folder: "One level down.",
  },
};
