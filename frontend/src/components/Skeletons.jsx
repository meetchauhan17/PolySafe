import React from 'react';

/**
 * Skeleton atomic block with industrial chassis shimmer.
 */
export function Skeleton({ className = '', rounded = 'rounded-lg' }) {
  return (
    <div
      className={`bg-[var(--chassis-dark)] shadow-[var(--shadow-recessed)] animate-pulse ${rounded} ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton for the Home Dashboard.
 */
export function HomeSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>

      {/* Status Card Skeleton */}
      <div className="p-6 rounded-[32px] bg-[var(--chassis)] shadow-[var(--shadow-card)] space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-2xl flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3.5 w-48" />
          </div>
        </div>
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>

      {/* Schedule Card Skeleton */}
      <div className="p-6 rounded-[32px] bg-[var(--chassis)] shadow-[var(--shadow-card)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-md" />
            <Skeleton className="h-5 w-36" />
          </div>
          <Skeleton className="h-5 w-16 rounded-lg" />
        </div>

        <div className="space-y-3 pt-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3.5 rounded-xl bg-[var(--chassis)] shadow-[var(--shadow-recessed)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-7 w-16 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-5 w-12 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for Medication Timeline.
 */
export function TimelineSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>

      <div className="p-4 rounded-[32px] bg-[var(--chassis)] shadow-[var(--shadow-card)] flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-12" />
        </div>
        <div className="h-8 w-[2px] bg-[var(--chassis-dark)]" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-12" />
        </div>
        <div className="h-8 w-[2px] bg-[var(--chassis-dark)]" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-12" />
        </div>
      </div>

      <div className="relative pl-6 space-y-5">
        <div className="absolute left-[7px] top-2 bottom-4 w-[3px] bg-[var(--accent-secondary)]" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="relative">
            <div className="absolute -left-6 top-5 w-3.5 h-3.5 rounded-full border-2 border-white bg-[var(--accent-secondary)]" />
            <div className="p-4 rounded-[24px] bg-[var(--chassis)] shadow-[var(--shadow-card)] space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for Risk Analysis Detail Page.
 */
export function RiskAnalysisSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-9 w-9 rounded-xl flex-shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-3.5 w-28" />
        </div>
      </div>

      <div className="p-6 rounded-[32px] bg-[var(--chassis)] shadow-[var(--shadow-card)] space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-52" />
          </div>
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-[24px] bg-[var(--chassis)] shadow-[var(--shadow-card)] space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-28" />
        </div>
        <div className="p-4 rounded-[24px] bg-[var(--chassis)] shadow-[var(--shadow-card)] space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-28" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for Doctor Dashboard Patient List (Sidebar).
 */
export function DoctorPatientListSkeleton() {
  return (
    <div className="space-y-2.5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-3.5 rounded-xl bg-[var(--chassis)] shadow-[var(--shadow-sm)] space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for Doctor Dashboard Patient Detail Panel.
 */
export function DoctorPatientDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-[32px] bg-[var(--chassis)] shadow-[var(--shadow-card)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        </div>
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Skeleton for Insights & Trends Page.
 */
export function InsightsSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-3.5 w-64" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-[24px] bg-[var(--chassis)] shadow-[var(--shadow-card)] space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="p-4 rounded-[24px] bg-[var(--chassis)] shadow-[var(--shadow-card)] space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="p-4 rounded-[24px] bg-[var(--chassis)] shadow-[var(--shadow-card)] space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}
