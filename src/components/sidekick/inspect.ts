const NAME_MAX = 40;
const SEPARATOR = " · ";
const ELLIPSIS = "…";
const EN_DASH = "–";
const ARROW = "→";

function truncate(value: string): string {
  return value.length > NAME_MAX ? `${value.slice(0, NAME_MAX - 1)}${ELLIPSIS}` : value;
}

function collapse(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function join(parts: Array<string | false | null | undefined>): string {
  return parts.filter((part): part is string => Boolean(part)).join(SEPARATOR);
}

export function accessibleName(el: Element): string {
  const label = el.getAttribute("aria-label");
  if (label && collapse(label)) return truncate(collapse(label));

  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const text = collapse(
      labelledBy
        .split(/\s+/)
        .map((id) => el.ownerDocument.getElementById(id)?.textContent ?? "")
        .join(" "),
    );
    if (text) return truncate(text);
  }

  if (
    el instanceof HTMLInputElement ||
    el instanceof HTMLSelectElement ||
    el instanceof HTMLTextAreaElement
  ) {
    const text = collapse(
      Array.from(el.labels ?? [])
        .map((node) => node.textContent ?? "")
        .join(" "),
    );
    if (text) return truncate(text);
  }

  if (el instanceof HTMLFieldSetElement) {
    const legend = collapse(el.querySelector("legend")?.textContent ?? "");
    if (legend) return truncate(legend);
  }

  const title = el.getAttribute("title");
  if (title && collapse(title)) return truncate(collapse(title));

  const text = collapse(
    Array.from(el.childNodes).map((node) => node.textContent ?? "").join(" "),
  );
  return text ? truncate(text) : "";
}

function quotedName(el: Element): string {
  const name = accessibleName(el);
  return name ? ` "${name}"` : "";
}

function span(min: string | null, max: string | null): string {
  return min !== null && max !== null ? `${min}${EN_DASH}${max}` : "";
}

function destination(el: HTMLAnchorElement): string {
  const href = el.getAttribute("href");
  if (!href) return EN_DASH;
  if (!/^https?:/i.test(href)) return href;
  try {
    const url = new URL(href);
    return url.pathname === "/" ? url.host : `${url.host}${url.pathname}`;
  } catch {
    return href;
  }
}

function inspectInput(el: HTMLInputElement, quoted: string): string {
  if (el.type === "range") {
    const step = el.getAttribute("step");
    return join([
      `range${quoted}`,
      span(el.getAttribute("min"), el.getAttribute("max")),
      step && `step ${step}`,
    ]);
  }

  if (el.type === "checkbox" || el.type === "radio") {
    return join([`${el.type}${quoted}`, el.checked ? "checked" : "unchecked"]);
  }

  return join([
    `${el.type}${quoted}`,
    el.getAttribute("aria-invalid") !== null && "aria-invalid",
    el.required && "required",
    el.disabled && "disabled",
  ]);
}

export function inspect(el: Element): string {
  const quoted = quotedName(el);
  const role = el.getAttribute("role");

  if (role === "slider") {
    const now = el.getAttribute("aria-valuenow");
    return join([
      `slider${quoted}`,
      span(el.getAttribute("aria-valuemin"), el.getAttribute("aria-valuemax")),
      now !== null && `now ${now}`,
    ]);
  }

  if (role === "dialog") {
    const modal = el.getAttribute("aria-modal");
    return join([`dialog${quoted}`, modal !== null && `aria-modal ${modal}`]);
  }

  if (el instanceof HTMLAnchorElement) return `a ${ARROW} ${destination(el)}`;
  if (el instanceof HTMLInputElement) return inspectInput(el, quoted);

  if (el instanceof HTMLButtonElement) {
    const pressed = el.getAttribute("aria-pressed");
    const expanded = el.getAttribute("aria-expanded");
    return join([
      `button${quoted}`,
      pressed !== null && `pressed ${pressed}`,
      expanded !== null && `expanded ${expanded}`,
      el.disabled && "disabled",
    ]);
  }

  return `${role ?? el.tagName.toLowerCase()}${quoted}`;
}
