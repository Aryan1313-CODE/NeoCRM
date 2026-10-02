import React from "react";
export function Button({ variant = "primary", className = "", children, ...props }) {
  return <button className={`${variant === "secondary" ? "secondary-btn" : variant === "filter" ? "filter-btn" : "primary-btn"} ${className}`.trim()} {...props}>{children}</button>;
}
