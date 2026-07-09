import React from "react";
import { Skeleton } from "../ui/Skeleton.jsx";

export function ReferralSummarySkeleton() {
  return (
    <div className="referralSummarySkeleton">
      <Skeleton width="42%" height={14} />
      <Skeleton width="68%" height={34} style={{ marginTop: 12 }} />
      <Skeleton width="52%" height={12} style={{ marginTop: 10 }} />
      <div className="referralMetricSkeletonGrid">
        <Skeleton height={72} />
        <Skeleton height={72} />
        <Skeleton height={72} />
        <Skeleton height={72} />
      </div>
    </div>
  );
}

export function ReferralLinkSkeleton() {
  return (
    <div className="referralLinkSkeleton">
      <Skeleton width="100%" height={48} style={{ borderRadius: 14 }} />
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <Skeleton width={120} height={40} style={{ borderRadius: 12 }} />
        <Skeleton width={120} height={40} style={{ borderRadius: 12 }} />
      </div>
    </div>
  );
}
