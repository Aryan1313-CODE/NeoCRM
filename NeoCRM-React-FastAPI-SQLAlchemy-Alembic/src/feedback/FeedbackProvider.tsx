import React, { createContext, useContext, useState } from "react";

const FeedbackContext = createContext(null);
export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  function push(message, type = "success") {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    window.setTimeout(() => setToasts(prev => prev.filter(item => item.id !== id)), 3500);
  }
  return <FeedbackContext.Provider value={{ push }}>
    {children}
    <div className="toast-stack">{toasts.map(t => <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>)}</div>
  </FeedbackContext.Provider>;
}
export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("useFeedback must be inside FeedbackProvider");
  return context;
}
export const useToast = useFeedback;
