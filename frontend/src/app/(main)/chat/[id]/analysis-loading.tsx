'use client';
import { cn } from '@/lib/utils';

interface AnalysisLoadingProps {
  progress?: number; // Progress from API (0-100)
  className?: string;
}

export function AnalysisLoading({ progress = 0, className }: AnalysisLoadingProps) {
  return (
    <div className={cn('flex min-h-[90vh] items-center justify-center', className)}>
      <div className="mx-auto w-full max-w-2xl px-6">
        {/* Processing header */}
        <div className="mb-12 flex items-center justify-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="font-mono text-sm tracking-wider text-accent uppercase">
            Processing
          </span>
        </div>

        <div className="space-y-6">
          {/* Main content skeleton */}
          <div className="space-y-4">
            <div className="h-6 animate-pulse rounded bg-neutral-800" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-800" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-800" />
          </div>

          {/* Fact check cards skeleton */}
          <div className="mt-8 grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3 rounded-lg border border-neutral-800 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 animate-pulse rounded-full bg-neutral-800" />
                  <div className="h-4 flex-1 animate-pulse rounded bg-neutral-800" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 animate-pulse rounded bg-neutral-800" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-neutral-800" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-800" />
                </div>
              </div>
            ))}
          </div>

          {/* Progress indicator */}
          <div className="mt-8 text-center">
            <div className="font-mono text-sm text-neutral-400">{Math.round(progress)}% complete</div>
          </div>
        </div>
      </div>
    </div>
  );
}
