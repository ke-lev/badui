"use client";

import { useEffect, useState } from "react";
import type { ComponentMeta } from "@/components/meta";
import {
  giveBack,
  nextEstimate,
  remainingSeconds,
  remainingText,
  planPeak,
  stepToward,
  THINK_ESTIMATE_START,
  THINK_FINAL_CREDITS,
  THINK_LINE_DURATIONS,
  THINK_SCRIPT,
  THINK_TICK_MS,
  THINK_WARN_AT,
  warningCredits,
} from "./rules";
import { thinkingPrompt } from "./thinking.prompt";
import styles from "./feedback.module.css";

type Thought = {
  seconds: number;
  lines: readonly string[];
  reached: number;
  resumed: number | null;
};

type Run = {
  phase: "working" | "thinking" | "limit";
  percent: number;
  /** Where the current burst started and where it stops. */
  from: number;
  peak: number;
  /** The highest percentage this upload has shown. */
  highest: number;
  /** Bursts completed so far. */
  cycle: number;
  /** The estimate this burst started with, and working ticks since it started. */
  estimate: number;
  ticks: number;
  /** When the current thinking phase began, from performance.now(). */
  since: number;
  /** The scripted line showing while thinking, within THINK_SCRIPT[cycle]. */
  line: number;
  thought: Thought | null;
};

function startRun(): Run {
  return {
    phase: "working",
    percent: 0,
    from: 0,
    peak: planPeak(0, Math.random),
    highest: 0,
    cycle: 0,
    estimate: THINK_ESTIMATE_START,
    ticks: 0,
    since: 0,
    line: 0,
    thought: null,
  };
}

function tick(run: Run): Run {
  if (run.percent < run.peak) {
    const percent = stepToward(run.percent, run.peak, Math.random);
    return { ...run, percent, highest: Math.max(run.highest, percent), ticks: run.ticks + 1 };
  }
  return { ...run, phase: "thinking", since: performance.now(), line: 0 };
}

/** The next scripted line, or back to work after the last one. */
function advance(run: Run): Run {
  if (run.line + 1 < THINK_SCRIPT[run.cycle].length) return { ...run, line: run.line + 1 };
  if (run.cycle === THINK_SCRIPT.length - 1) {
    return {
      ...run,
      phase: "limit",
      thought: {
        seconds: Math.round((performance.now() - run.since) / 1000),
        lines: THINK_SCRIPT[run.cycle],
        reached: run.percent,
        resumed: null,
      },
    };
  }
  return resume(run);
}

function resume(run: Run): Run {
  const percent = giveBack(run.percent, run.from, run.cycle, Math.random);
  // Measured rather than planned, so a throttled background tab still reports
  // the time it actually spent.
  const seconds = Math.round((performance.now() - run.since) / 1000);
  return {
    ...run,
    phase: "working",
    percent,
    from: percent,
    peak: planPeak(run.cycle + 1, Math.random),
    cycle: run.cycle + 1,
    estimate: run.cycle === 4 ? THINK_ESTIMATE_START : nextEstimate(run.estimate, Math.random),
    ticks: 0,
    thought: { seconds, lines: THINK_SCRIPT[run.cycle], reached: run.percent, resumed: percent },
  };
}

function notice(run: Run | null): string {
  if (run?.phase === "limit") return "Usage limit reached. Upgrade your plan or purchase more credits to continue.";
  if (run && run.highest >= THINK_WARN_AT) return "Your usage credits are running low.";
  return "";
}

export function Thinking() {
  const [run, setRun] = useState<Run | null>(null);
  const phase = run?.phase;
  const cycle = run?.cycle;
  const line = run?.line;

  useEffect(() => {
    if (phase !== "working") return;
    const timer = window.setInterval(() => setRun((r) => r && tick(r)), THINK_TICK_MS);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "thinking" || cycle === undefined || line === undefined) return;
    const timer = window.setTimeout(
      () => setRun((r) => r && advance(r)),
      THINK_LINE_DURATIONS[cycle][line],
    );
    return () => window.clearTimeout(timer);
  }, [phase, cycle, line]);

  const thinking = phase === "thinking";
  const working = phase === "working";
  const running = working || thinking;
  const limited = phase === "limit";
  const percent = run?.percent ?? 0;
  const highest = run?.highest ?? 0;
  const message = notice(run);
  const credits = limited ? 0 : thinking && run && run.cycle === THINK_SCRIPT.length - 1
    ? THINK_FINAL_CREDITS[run.line]
    : run && highest >= THINK_WARN_AT ? warningCredits(run.cycle, percent, run.from) : null;
  const status = !run
    ? "Ready to upload"
    : limited
      ? "Upload stopped"
      : thinking
        ? THINK_SCRIPT[run.cycle][run.line]
        : remainingText(run.estimate);
  const state = thinking ? ", thinking" : limited ? ", stopped" : "";

  return (
    <div className={`${styles.specimen} ${styles.surface} ${styles.upload}`}>
      <div className={styles.fileRow}>
        <span className={styles.fileName}>report-final-FINAL.pdf</span>
        <span className={styles.meta}>4.2 MB</span>
      </div>
      <p className={styles.percent} aria-hidden="true">{percent.toFixed(1)}%</p>
      <div
        className={styles.track}
        role="progressbar"
        data-sidekick="thinking-progress"
        aria-label="Upload progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${percent.toFixed(1)}%${state}`}
      >
        <div className={styles.highWater} style={{ transform: `scaleX(${highest / 100})` }} />
        <div className={styles.fill} style={{ transform: `scaleX(${percent / 100})` }} />
      </div>
      <div className={styles.thoughtRow}>
        {run?.thought && (
          <details key={run.cycle} className={styles.thought}>
            <summary data-sidekick="thinking-thought">
              Thought for {run.thought.seconds} seconds
            </summary>
            <ul>
              {run.thought.lines.map((text) => (
                <li key={text}>{text}</li>
              ))}
              <li>
                {run.thought.resumed === null
                  ? `Stopped at ${run.thought.reached.toFixed(1)}%.`
                  : `Reached ${run.thought.reached.toFixed(1)}%. Resumed at ${run.thought.resumed.toFixed(1)}%.`}
              </li>
            </ul>
          </details>
        )}
      </div>
      <div className={styles.uploadFoot}>
        <div className={styles.statusSlot}>
          {/* While working, the status announces the burst's estimate once and
              the countdown beside it stays silent. */}
          <p className={thinking || working ? "sr-only" : styles.meta} role="status">
            {status}
          </p>
          {working && run && (
            <p className={styles.meta} aria-hidden="true">
              {remainingText(remainingSeconds(run.estimate, run.ticks))}
            </p>
          )}
          {thinking && run && (
            <p className={`${styles.meta} ${styles.shimmer}`} aria-hidden="true">
              {THINK_SCRIPT[run.cycle][run.line]}
            </p>
          )}
        </div>
        <button
          type="button"
          className={styles.iconButton}
          data-sidekick={running ? "thinking-stop" : "thinking-start"}
          aria-label={running ? "Stop" : "Upload"}
          onClick={() => setRun(running ? null : startRun())}
        >
          {running ? (
            <span className={styles.stopIcon} aria-hidden="true" />
          ) : (
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              <path
                d="M8 13V3M3.5 7.5 8 3l4.5 4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>
      <div role="status" className={styles.noticeSlot}>
        {message && (
          <p className={limited ? styles.noticeLimit : styles.noticeWarn}>
            {credits !== null && <>Usage credits remaining: {credits}%.<br /></>}
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export const thinkingMeta: ComponentMeta = {
  name: "Thinking",
  kind: "hostile",
  category: "feedback",
  summary:
    "A file upload that alternates between uploading and thinking. It pauses " +
    "six times with individually timed status lines. The second pause " +
    "returns it to 0%; the first, third, and fourth undo 25–55% of the " +
    "preceding burst; the fifth resumes between 21 and " +
    "28% and resets the estimate to three seconds. A credits warning appears " +
    "at 85% with 10% of credits remaining, falling to 5% halfway through " +
    "the climb after compaction. The final check holds at 95% while remaining credits fall " +
    "from 5% to zero, then stops the upload.",
  usage: "<Thinking />",
  prompt: thinkingPrompt,
  notes:
    "Burst lengths vary within fixed bands, so every run follows the same " +
    "script to the same end. A role=progressbar whose value rises and falls; " +
    "its aria-valuetext adds “thinking” during pauses and “stopped” at the " +
    "limit. A faint band marks the highest point reached. The status region " +
    "announces each scripted line. Each burst starts from an estimate that " +
    "counts down once a second, holding at one; the status region announces " +
    "only the starting estimate. The estimate increases by 2–5 seconds after " +
    "the first four pauses and resets after " +
    "compaction. Upload ticks run every 150ms; scripted pauses total 23.6 " +
    "seconds. After each pause a " +
    "disclosure reports its measured length, its script, and where the upload " +
    "resumed or stopped. The credits notices sit in their own status region. Upload and " +
    "Stop are one icon button named by aria-label, so focus stays put.",
  lines: {
    "thinking-start": "Upload the file.",
    "thinking-progress": "",
    "thinking-thought": "",
    "thinking-stop": "Stop.",
  },
};
