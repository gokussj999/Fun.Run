import React from "react";

export function StatsBar({ items }) {
  if (!items?.length) return null;

  return (
    <section className="landingSectionTight">
      <div className="landingContainer">
        <div className="landingStatsGrid">
          {items.map((item) => (
            <div key={item.label} className="landingStatCard">
              <div className="landingStatValue">{item.value}</div>
              <div className="landingStatLabel">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
