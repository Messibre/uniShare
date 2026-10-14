export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-label-md focus:font-medium focus:text-on-primary focus:shadow-[var(--shadow-level-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      Skip to main content
    </a>
  );
}
