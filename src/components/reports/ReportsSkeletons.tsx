import React from 'react';

export const ReportsSkeletons: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 rounded-md" />
          <div className="h-4 w-80 bg-slate-100 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-28 bg-slate-200 rounded-lg" />
          <div className="h-8 w-24 bg-slate-200 rounded-lg" />
        </div>
      </div>

      {/* 6 Executive Cards Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 bg-slate-200 rounded" />
              <div className="h-6 w-6 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-6 w-24 bg-slate-300 rounded" />
            <div className="h-3 w-20 bg-slate-100 rounded pt-1" />
          </div>
        ))}
      </div>

      {/* Evolution Chart Skeleton */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-40 bg-slate-200 rounded" />
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-slate-100 rounded" />
            <div className="h-6 w-16 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="h-56 w-full bg-slate-50 rounded-lg" />
      </div>

      {/* 2-column Grid Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 h-48" />
        <div className="bg-white rounded-xl border border-slate-200 p-5 h-48" />
      </div>
    </div>
  );
};
