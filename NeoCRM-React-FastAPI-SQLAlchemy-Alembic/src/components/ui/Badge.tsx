import React from "react";
export function Badge({ children, status = "active" }) { return <span className={`status-pill ${status}`}>{children}</span>; }
export function TypeBadge({ children }) { return <span className="type-tag">{children}</span>; }
