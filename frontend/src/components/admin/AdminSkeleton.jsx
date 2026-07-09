import React from "react";
import { Skeleton } from "../ui/Skeleton.jsx";

export function AdminSummarySkeleton() {
  return (
    <div className="adminSummarySkeleton">
      <Skeleton width="42%" height={14} />
      <Skeleton width="68%" height={34} style={{ marginTop: 12 }} />
      <Skeleton width="52%" height={12} style={{ marginTop: 10 }} />
      <div className="adminMetricSkeletonGrid">
        <Skeleton height={72} />
        <Skeleton height={72} />
        <Skeleton height={72} />
        <Skeleton height={72} />
      </div>
    </div>
  );
}

export function AdminPanelSkeleton() {
  return (
    <div className="adminPanelSkeleton">
      <Skeleton width="40%" height={14} />
      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        <Skeleton height={42} />
        <Skeleton height={42} />
        <Skeleton height={42} />
        <Skeleton height={42} />
      </div>
    </div>
  );
}
