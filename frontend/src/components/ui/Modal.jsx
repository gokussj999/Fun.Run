import React from "react";

export function Modal({ onClose, children, cardStyle, className = "" }) {
  return (
    <div className={`modalBack ${className}`.trim()} onClick={onClose}>
      <div
        className="modalCard"
        onClick={(e) => e.stopPropagation()}
        style={cardStyle}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHead({ children, title, right }) {
  return (
    <div className="modalHead">
      {title ? <div className="modalTitle">{title}</div> : children}
      {right}
    </div>
  );
}

export function ModalBody({ children, style }) {
  return (
    <div className="modalBody" style={style}>
      {children}
    </div>
  );
}
