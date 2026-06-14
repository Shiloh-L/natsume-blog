export default function PostCardSkeleton() {
  return (
    <div className="paper-card overflow-hidden">
      <div className="h-48 animate-pulse bg-ink/5" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-3/4 animate-pulse rounded bg-ink/5" />
        <div className="h-4 w-full animate-pulse rounded bg-ink/5" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-ink/5" />
        <div className="flex gap-2 pt-2">
          <div className="h-5 w-12 animate-pulse rounded-full bg-ink/5" />
          <div className="h-5 w-12 animate-pulse rounded-full bg-ink/5" />
        </div>
      </div>
    </div>
  )
}
