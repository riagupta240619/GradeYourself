export function ResourceSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Search and control bar skeleton */}
      <div className="surface-card rounded-2xl p-5 space-y-3 border border-[var(--border)]">
        <div className="flex flex-wrap gap-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-7 w-24 rounded-full bg-[var(--bg-surface-elevated)]"
            />
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <div className="h-10 flex-1 rounded-xl bg-[var(--bg-surface-elevated)]" />
          <div className="h-10 w-10 rounded-xl bg-[var(--bg-surface-elevated)]" />
          <div className="h-10 w-28 rounded-xl bg-[var(--bg-surface-elevated)]" />
        </div>
      </div>

      {/* Tree / Cards skeleton */}
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="surface-card rounded-2xl p-5 border border-[var(--border)] space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[var(--bg-surface-elevated)]" />
                <div className="space-y-1.5">
                  <div className="h-5 w-48 rounded-md bg-[var(--bg-surface-elevated)]" />
                  <div className="h-3.5 w-72 rounded-md bg-[var(--bg-surface-elevated)]" />
                </div>
              </div>
              <div className="h-6 w-20 rounded-md bg-[var(--bg-surface-elevated)]" />
            </div>
            <div className="grid gap-2 pt-2 sm:grid-cols-2">
              <div className="h-14 rounded-xl bg-[var(--bg-surface-elevated)]/60" />
              <div className="h-14 rounded-xl bg-[var(--bg-surface-elevated)]/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
