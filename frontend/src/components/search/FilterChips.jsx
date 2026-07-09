import React from "react";

export function FilterChips({ items = [], value, onChange, label }) {
  if (!items.length) return null;

  return (
    <div className="filterChipsWrap">
      {label ? <div className="filterChipsLabel">{label}</div> : null}
      <div className="filterChips" role="group" aria-label={label || "Filters"}>
        {items.map((item) => {
          const active = value === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`filterChip ${active ? "active" : ""}`}
              aria-pressed={active}
              onClick={() => onChange?.(item.id)}
            >
              {item.label}
              {item.count != null ? <span className="filterChipCount">{item.count}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function RecentSearchChips({ items = [], onSelect, onClear }) {
  if (!items.length) return null;

  return (
    <div className="filterChipsWrap">
      <div className="filterChipsLabelRow">
        <div className="filterChipsLabel">Recent</div>
        <button type="button" className="filterChipsClear" onClick={onClear}>
          Clear
        </button>
      </div>
      <div className="filterChips">
        {items.map((term) => (
          <button key={term} type="button" className="filterChip recent" onClick={() => onSelect?.(term)}>
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
