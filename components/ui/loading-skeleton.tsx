export function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-12 w-64" />
          <div className="skeleton h-4 w-48" />
        </div>
        <div className="skeleton h-16 w-32 rounded-2xl" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="skeleton h-12 w-12 rounded-xl" />
              <div className="skeleton h-5 w-5 rounded" />
            </div>
            <div className="space-y-2">
              <div className="skeleton h-4 w-20" />
              <div className="skeleton h-10 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="glass rounded-2xl p-6 space-y-4">
            <div className="skeleton h-6 w-32" />
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="skeleton h-16 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="skeleton h-6 w-32" />
        <div className="skeleton h-8 w-20 rounded-full" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton h-12 w-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass rounded-2xl overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-zinc-800/50">
        <div className="skeleton h-6 w-40" />
      </div>
      <div className="divide-y divide-zinc-800/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <div className="skeleton h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton h-3 w-1/3" />
            </div>
            <div className="skeleton h-8 w-24 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
