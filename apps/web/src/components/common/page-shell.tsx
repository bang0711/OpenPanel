/**
 * Full-width page wrapper for top-level (dashboard) pages. The app shell is
 * pinned to the viewport, so the page body scrolls here rather than the window.
 */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
      {children}
    </div>
  );
}
