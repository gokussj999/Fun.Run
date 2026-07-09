import React from "react";
import { CogIcon, HomeIcon, PlusIcon, SearchIcon, UserIcon } from "./NavIcons.jsx";

const TABS = [
  { id: "HOME", label: "Home", Icon: HomeIcon },
  { id: "SEARCH", label: "Search", Icon: SearchIcon },
  { id: "CREATE", label: "Create", Icon: PlusIcon },
  { id: "PROFILE", label: "Profile", Icon: UserIcon },
  { id: "SETTINGS", label: "Settings", Icon: CogIcon },
];

export function FooterNav({ screen, onNavigate }) {
  return (
    <nav className="footerNav" aria-label="Main navigation">
      {TABS.map(({ id, label, Icon }) => {
        const active = screen === id;
        return (
          <button
            key={id}
            type="button"
            className={`footerBtn ${active ? "active" : ""}`}
            onClick={() => onNavigate(id)}
            aria-current={active ? "page" : undefined}
            aria-label={label}
          >
            <span className="footerBtnLabel">
              <span className="footerBtnIcon">
                <Icon />
              </span>
              <span>{label}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
