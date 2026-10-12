"use client";

import { useEffect, useRef } from "react";
import styles from "./lilbuddy-link.module.css";

export function LilbuddyLink() {
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const link = linkRef.current;
    if (!link) return;
    let inView = true;
    const sync = () => {
      link.dataset.paused = String(document.hidden || !inView);
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    observer.observe(link);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <a
      ref={linkRef}
      className={`github-link ${styles.link}`}
      href="https://lilbuddy.ke1ev.dev/"
      data-sidekick="lilbuddy"
    >
      <span className={styles.content}>
        <span className="nav-pitch">check out my mac app: </span>
        <span className={styles.name}>
          lilbuddy
          <svg className={styles.arrow} aria-hidden="true" width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M4 12 12 4M4.5 4H12v7.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
    </a>
  );
}
