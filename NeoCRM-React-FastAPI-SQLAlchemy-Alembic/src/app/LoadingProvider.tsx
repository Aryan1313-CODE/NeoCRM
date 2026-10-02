import React, { createContext, useContext, useState } from "react";
const LoadingContext = createContext(null);
export function LoadingProvider({ children }) { const [count,setCount]=useState(0); const value={start:()=>setCount(c=>c+1),stop:()=>setCount(c=>Math.max(0,c-1)),loading:count>0}; return <LoadingContext.Provider value={value}>{children}{count>0&&<div className="global-loading"><span>Working...</span></div>}</LoadingContext.Provider>; }
export function useLoading(){const c=useContext(LoadingContext);if(!c)throw new Error("useLoading must be inside LoadingProvider");return c;}
