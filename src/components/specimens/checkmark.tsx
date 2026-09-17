export function Checkmark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path d="m3.5 8 3 3 6-6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
