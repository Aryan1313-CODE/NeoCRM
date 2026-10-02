import React from "react";
export function Card({ className = "", children, ...props }) { return <section className={`panel ${className}`.trim()} {...props}>{children}</section>; }
export function CardHeader({ title, description, action }) { return <div className="panel-heading"><div><h3>{title}</h3>{description && <span>{description}</span>}</div>{action}</div>; }
