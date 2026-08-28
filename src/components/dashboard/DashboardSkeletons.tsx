import React from 'react';
import { Skeleton } from '../ui/Skeleton';
import { Card, CardHeader, CardContent } from '../ui/Card';

export const DashboardSkeletons: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>

      {/* Financial Summary Cards Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton variant="circular" className="w-7 h-7" />
            </div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-full" />
          </Card>
        ))}
      </div>

      {/* Operational Metrics Bar Skeletons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-3 rounded-lg border border-slate-200 bg-white space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-10" />
          </div>
        ))}
      </div>

      {/* Main Grid Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-4 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-44 w-full" />
          </Card>
          <Card className="p-4 space-y-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-4 space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-24 w-full" />
          </Card>
          <Card className="p-4 space-y-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </Card>
        </div>
      </div>
    </div>
  );
};
