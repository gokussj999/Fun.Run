import React from "react";
import { MiniBtn } from "../ui/Button.jsx";

export function BackButton({ onClick, label = "← Back" }) {
  return (
    <MiniBtn className="fr-backBtn" onClick={onClick}>
      {label}
    </MiniBtn>
  );
}
