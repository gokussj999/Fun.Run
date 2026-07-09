import React from "react";

export function PageHeader({ title, sub, right, className = "" }) {
  return (
    <div className={`pageHeader ${className}`.trim()}>
      <div className="pageHeaderMain">
        <h1 className="pageHeaderTitle">{title}</h1>
        {sub ? <p className="pageHeaderSub">{sub}</p> : null}
      </div>
      {right ? <div className="pageHeaderRight">{right}</div> : null}
    </div>
  );
}
