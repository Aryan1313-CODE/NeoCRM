import React from "react";
import { X } from "lucide-react";
export function Dialog({ open, title, onClose, children }) {
  if (!open) return null;
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal-card" onMouseDown={e => e.stopPropagation()}>
    <div className="modal-header"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18}/></button></div>{children}
  </div></div>;
}
