"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { ComponentMeta } from "@/components/meta";
import { mitosisButtonPrompt } from "./mitosis-button.prompt";
import {
  DIVISION_MS,
  DIVISION_STEPS,
  LABEL_STEPS,
  divisionTransform,
  extentAlong,
  lerpPoint,
  neckLength,
  splitAt,
  type Point,
} from "./mitosis";
import styles from "./buttons.module.css";

const EDGE = 8;
const SPLIT_DISTANCE = 42;
const NECK_SIZE = 24;
const NECK_OVERLAP = 12;
const BLOB_INSET = 1;
const INITIAL_CELL: Cell = { id: 0, point: { x: 0, y: 0 } };

type Cell = {
  id: number;
  point: Point;
};

/** A split in flight: the parent's centre at the click and both resting centres. */
type Division = {
  parentId: number;
  childId: number;
  start: Point;
  first: Point;
  second: Point;
  axis: Point;
  width: number;
  height: number;
};

type PendingPointer = {
  id: number;
  clientX: number;
  clientY: number;
};

function arenaPoint(arena: DOMRect, clientX: number, clientY: number): Point {
  return {
    x: clientX - arena.left - arena.width / 2,
    y: clientY - arena.top - arena.height / 2,
  };
}

function centreOf(rect: DOMRect, arena: DOMRect): Point {
  return arenaPoint(arena, rect.left + rect.width / 2, rect.top + rect.height / 2);
}

function restTransform(point: Point): string {
  return `translate(-50%, -50%) translate(${point.x}px, ${point.y}px)`;
}

function cellFrames(start: Point, end: Point, axis: Point): Keyframe[] {
  return DIVISION_STEPS.map((step) => ({
    offset: step.offset,
    easing: step.easing,
    transform: divisionTransform(lerpPoint(start, end, step.travel), axis, step.along, step.across),
  }));
}

/** The neck spans the gap at every step and thins across it until it snaps. */
function neckFrames(division: Division): Keyframe[] {
  const middle = lerpPoint(division.first, division.second, 0.5);
  const distance = Math.hypot(division.axis.x, division.axis.y);
  const unit = distance > 0
    ? { x: division.axis.x / distance, y: division.axis.y / distance }
    : { x: 0, y: -1 };
  const extent = extentAlong(unit, division.width, division.height);
  return DIVISION_STEPS.map((step) => ({
    offset: step.offset,
    easing: step.easing,
    transform: divisionTransform(
      lerpPoint(division.start, middle, step.travel),
      division.axis,
      neckLength(distance * step.travel, extent * step.along, NECK_OVERLAP, NECK_SIZE) / NECK_SIZE,
      step.neck,
    ),
  }));
}

export function MitosisButton() {
  const [cells, setCells] = useState<Cell[]>([INITIAL_CELL]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [presses, setPresses] = useState(0);
  const arenaRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef(new Map<number, HTMLButtonElement>());
  const blobRefs = useRef(new Map<number, HTMLDivElement>());
  const startedRef = useRef(new Set<number>());
  const pendingPointerRef = useRef<PendingPointer | null>(null);
  const nextIdRef = useRef(1);
  const reducedMotionRef = useRef(false);
  const gooId = `mitosis-goo-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      reducedMotionRef.current = query.matches;
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Before paint, so a new child's first frame is already at the parent's centre.
  useLayoutEffect(() => {
    for (const division of divisions) {
      if (startedRef.current.has(division.childId)) continue;
      startedRef.current.add(division.childId);

      const parent = buttonRefs.current.get(division.parentId);
      const child = buttonRefs.current.get(division.childId);
      const group = blobRefs.current.get(division.childId);
      if (!parent || !child || !group) continue;

      const timing: KeyframeAnimationOptions = { duration: DIVISION_MS };
      const blobTiming: KeyframeAnimationOptions = { duration: DIVISION_MS, fill: "forwards" };
      const [parentBlob, childBlob, neck] = Array.from(group.children) as HTMLElement[];

      for (const animation of parent.getAnimations({ subtree: true })) animation.cancel();
      parent.animate(cellFrames(division.start, division.first, division.axis), timing);
      child.animate(cellFrames(division.start, division.second, division.axis), timing);
      parent.firstElementChild?.animate([...LABEL_STEPS], timing);
      child.firstElementChild?.animate([...LABEL_STEPS], timing);
      parentBlob.animate(cellFrames(division.start, division.first, division.axis), blobTiming);
      childBlob.animate(cellFrames(division.start, division.second, division.axis), blobTiming);
      neck.animate(neckFrames(division), blobTiming).onfinish = () => {
        setDivisions((current) => current.filter((item) => item.childId !== division.childId));
      };
    }
  }, [divisions]);

  function rememberPointer(id: number, event: ReactPointerEvent<HTMLButtonElement>) {
    pendingPointerRef.current = { id, clientX: event.clientX, clientY: event.clientY };
  }

  function clearKeyboardPointer(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " ") pendingPointerRef.current = null;
  }

  function split(id: number, event: ReactMouseEvent<HTMLButtonElement>) {
    const arena = arenaRef.current;
    if (!arena) return;

    const button = event.currentTarget;
    const arenaRect = arena.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const center = centreOf(buttonRect, arenaRect);
    const pending = pendingPointerRef.current?.id === id ? pendingPointerRef.current : null;
    const cursor = pending
      ? arenaPoint(arenaRect, pending.clientX, pending.clientY)
      : center;
    pendingPointerRef.current = null;

    const width = button.offsetWidth || buttonRect.width;
    const height = button.offsetHeight || buttonRect.height;
    const half = { x: width / 2, y: height / 2 };
    const arenaWidth = arena.clientWidth || arenaRect.width;
    const arenaHeight = arena.clientHeight || arenaRect.height;
    const bounds = {
      minX: -arenaWidth / 2 + half.x + EDGE,
      maxX: arenaWidth / 2 - half.x - EDGE,
      minY: -arenaHeight / 2 + half.y + EDGE,
      maxY: arenaHeight / 2 - half.y - EDGE,
    };
    const result = splitAt(center, cursor, bounds, SPLIT_DISTANCE);
    const newId = nextIdRef.current++;
    const animate = !reducedMotionRef.current && typeof button.animate === "function";

    setCells((current) => {
      if (!current.some((cell) => cell.id === id)) return current;
      return current.flatMap((cell) =>
        cell.id === id
          ? [
              { id: cell.id, point: result.first },
              { id: newId, point: result.second },
            ]
          : [cell],
      );
    });
    setDivisions((current) => {
      // A button split again mid-flight leaves its earlier neck behind.
      const kept = current.filter((item) => item.parentId !== id && item.childId !== id);
      if (!animate) return kept;
      return [
        ...kept,
        {
          parentId: id,
          childId: newId,
          start: center,
          first: result.first,
          second: result.second,
          axis: { x: result.second.x - result.first.x, y: result.second.y - result.first.y },
          width,
          height,
        },
      ];
    });
    setPresses((count) => count + 1);
  }

  return (
    <div className={styles.specimen}>
      <div className={`${styles.arena} ${styles.mitosisArena}`} ref={arenaRef}>
        <svg className={styles.gooFilter} aria-hidden="true" focusable="false">
          <filter id={gooId} colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="6" />
            <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -12" />
          </filter>
        </svg>
        <div className={styles.goo} style={{ filter: `url(#${gooId})` }} aria-hidden="true">
          {divisions.map((division) => (
            <div
              key={division.childId}
              ref={(element) => {
                if (element) blobRefs.current.set(division.childId, element);
                else blobRefs.current.delete(division.childId);
              }}
            >
              {["parent", "child"].map((role) => (
                <div
                  key={role}
                  className={styles.blob}
                  style={{
                    width: division.width - BLOB_INSET * 2,
                    height: division.height - BLOB_INSET * 2,
                    transform: restTransform(division.start),
                  }}
                />
              ))}
              <div
                className={styles.neck}
                style={{
                  width: NECK_SIZE,
                  height: NECK_SIZE,
                  transform: divisionTransform(division.start, division.axis, 0, 0),
                }}
              />
            </div>
          ))}
        </div>
        {cells.map((cell) => (
          <button
            key={cell.id}
            type="button"
            className={`${styles.button} ${styles.mitosisCell}`}
            ref={(element) => {
              if (element) buttonRefs.current.set(cell.id, element);
              else buttonRefs.current.delete(cell.id);
            }}
            style={{ transform: restTransform(cell.point), zIndex: cell.id + 1 }}
            data-sidekick="mitosis-button"
            onPointerDown={(event) => rememberPointer(cell.id, event)}
            onKeyDown={clearKeyboardPointer}
            onClick={(event) => split(cell.id, event)}
          >
            <span>Split</span>
          </button>
        ))}
      </div>
      <p
        className={`${styles.readout} ${styles.mitosisReadout}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span>Buttons <span className={styles.count}>{cells.length}</span></span>
        <span>Presses <span className={styles.count}>{presses}</span></span>
      </p>
    </div>
  );
}

export const mitosisButtonMeta: ComponentMeta = {
  name: "Mitosis",
  kind: "hostile",
  category: "buttons",
  summary:
    "A Split button that becomes two buttons when pressed. The pair separates " +
    "from the pointer position, and each resulting button can split again.",
  usage: "<MitosisButton />",
  prompt: mitosisButtonPrompt,
  notes:
    "The clicked button keeps its place in the collection and a new button joins " +
    "it. Over 600ms the button stretches along the split axis, the pair pulls " +
    "apart past the pointer's two sides joined by a thinning neck, and both " +
    "settle. The motion runs on the Web Animations API against transforms; the " +
    "neck is drawn on a blurred, alpha-thresholded layer behind the buttons. " +
    "Pointer presses split at their recorded client position; keyboard presses " +
    "split at the button's centre. The arena keeps every button inside its edges " +
    "and the readout announces button and press counts. Under " +
    "prefers-reduced-motion the same positions and counts update without motion.",
  lines: {
    "mitosis-button": "It makes room for another one.",
  },
};
