import React from "react";
import { SearchIcon } from "../layout/NavIcons.jsx";

export function SearchBar({ value, onChange, onSubmit, placeholder = "Search by name, symbol, or creator wallet..." }) {
  return (
    <form
      className="discoverySearchBox"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(value);
      }}
    >
      <SearchIcon />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        aria-label="Search coins"
        autoComplete="off"
        spellCheck={false}
      />
      {value ? (
        <button type="button" className="discoverySearchClear" onClick={() => onChange?.("")} aria-label="Clear search">
          ×
        </button>
      ) : null}
    </form>
  );
}
