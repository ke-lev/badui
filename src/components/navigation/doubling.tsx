"use client";

import { useState } from "react";
import type { ComponentMeta } from "@/components/meta";
import { doublingPrompt } from "./doubling.prompt";
import { nextPage, PAGE_COUNT, previousPage, RESULTS_PER_PAGE } from "./rules";
import styles from "./navigation.module.css";

export function Doubling() {
  const [page, setPage] = useState(1);
  const first = (page - 1) * RESULTS_PER_PAGE + 1;
  const atStart = page === 1;
  const atEnd = page === PAGE_COUNT;

  return (
    <div className={styles.specimen}>
      <ol className={`${styles.results} ${styles.surface}`} start={first} aria-label="Results">
        {Array.from({ length: RESULTS_PER_PAGE }, (_, offset) => {
          const number = String(first + offset).padStart(3, "0");
          return (
            <li className={styles.result} key={number}>
              <span>Record {number}</span>
              <span className={styles.resultIndex} aria-hidden="true">#{number}</span>
            </li>
          );
        })}
      </ol>
      <nav className={styles.pager} aria-label="Pagination">
        <button
          type="button"
          className={styles.pageButton}
          data-sidekick="page-previous"
          aria-disabled={atStart}
          onClick={() => !atStart && setPage(previousPage)}
        >
          Previous
        </button>
        <p className={styles.pageStatus} role="status" aria-live="polite" aria-atomic="true">
          Page <strong>{page}</strong> of {PAGE_COUNT}
        </p>
        <button
          type="button"
          className={styles.pageButton}
          data-sidekick="page-next"
          aria-disabled={atEnd}
          onClick={() => !atEnd && setPage(nextPage)}
        >
          Next
        </button>
      </nav>
    </div>
  );
}

export const doublingMeta: ComponentMeta = {
  name: "Doubling",
  kind: "hostile",
  category: "navigation",
  summary:
    "Twenty-four pages of three records each. Next doubles the page number, " +
    "stopping at 24; Previous halves it, rounding down, stopping at 1.",
  usage: "<Doubling />",
  prompt: doublingPrompt,
  notes:
    "The controls sit in a nav labelled Pagination, and the page readout is a " +
    "status region. At either end the relevant button is aria-disabled rather " +
    "than disabled, so it keeps focus. Pages 5, 7, 9–11, 13–15, and 17–23 " +
    "have no route to them.",
  lines: {
    "page-previous": "Back, by half.",
    "page-next": "Onward, twice as far each time.",
  },
};
