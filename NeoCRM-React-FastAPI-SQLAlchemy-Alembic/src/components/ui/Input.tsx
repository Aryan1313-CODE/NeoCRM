import React from "react";
export function Input({ label, error, ...props }) { return <label className="modal-form-label">{label}<input {...props}/>{error && <small className="field-error">{error}</small>}</label>; }
