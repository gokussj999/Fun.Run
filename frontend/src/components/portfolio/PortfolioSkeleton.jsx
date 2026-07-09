import React from "react";
import { Skeleton } from "../ui/Skeleton.jsx";

export function PortfolioSummarySkeleton() {
  return (
    <div className="portfolioSummarySkeleton">
      <Skeleton width="42%" height={14} />
      <Skeleton width="68%" height={34} style={{ marginTop: 12 }} />
      <Skeleton width="52%" height={12} style={{ marginTop: 10 }} />
      <div className="portfolioMetricSkeletonGrid">
        <Skeleton height={72} />
        <Skeleton height={72} />
        <Skeleton height={72} />
        <Skeleton height={72} />
      </div>
    </div>
  );
}

export function AllocationSkeleton() {
  return (
    <div className="portfolioAllocationSkeleton">
      <Skeleton width="100%" height={14} style={{ borderRadius: 999 }} />
      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        <Skeleton height={38} />
        <Skeleton height={38} />
        <Skeleton height={38} />
      </div>
    </div>
  );
}
