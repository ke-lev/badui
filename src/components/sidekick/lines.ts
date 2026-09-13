import { inspect } from "./inspect";

const LINES: Record<string, string> = {
  "volume-dial": "It goes to 100. It does not go to 100 quickly.",
  "date-slider": "One hundred and twenty-seven years. One groove.",
  password: "Meeting a requirement is how you find the next one.",
  checkboxes: "Each one has an opinion about its neighbour.",
  "phone-digit": "Every digit is on speaking terms with the next.",
  dialog: "Cancel goes back one. Everything else goes forward.",
  "dialog-close": "This is not an exit.",
  reset: "The only control here that does what it says.",
};

export function line(el: Element): string {
  const key = el.closest("[data-sidekick]")?.getAttribute("data-sidekick");
  if (key && key in LINES) return LINES[key];
  return inspect(el);
}
