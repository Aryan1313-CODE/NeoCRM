import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
type Notice = { id:number; tone:'success'|'error'|'warning'|'info'; message:string };
type Feedback = { beginLoading:()=>()=>void; notify:{ [K in Notice['tone']]:(message:string)=>void } };
const Context=createContext<Feedback|null>(null); let nextId=0;
export function FeedbackProvider({children}:{children:ReactNode}){
 const [pending,setPending]=useState(0);const [notices,setNotices]=useState<Notice[]>([]);
 const beginLoading=useCallback(()=>{setPending(n=>n+1);let ended=false;return()=>{if(!ended){ended=true;setPending(n=>Math.max(0,n-1));}};},[]);
 const push=useCallback((tone:Notice['tone'],message:string)=>{const id=++nextId;setNotices(items=>[...items,{id,tone,message}]);window.setTimeout(()=>setNotices(items=>items.filter(item=>item.id!==id)),5000);},[]);
 const notify=useMemo(()=>({success:(m:string)=>push('success',m),error:(m:string)=>push('error',m),warning:(m:string)=>push('warning',m),info:(m:string)=>push('info',m)}),[push]);const value=useMemo(()=>({beginLoading,notify}),[beginLoading,notify]);
 return <Context.Provider value={value}>{children}<div className="global-progress" aria-hidden="true" data-active={pending>0}/><div className="toast-stack" aria-label="Notifications">{notices.map(n=><div key={n.id} className={`toast toast-${n.tone}`} role={n.tone==='error'?'alert':'status'}><span className="toast-symbol" aria-hidden="true">{n.tone==='success'?'✓':n.tone==='error'?'!':n.tone==='warning'?'⚠':'i'}</span><span>{n.message}</span><button aria-label="Dismiss notification" onClick={()=>setNotices(items=>items.filter(item=>item.id!==n.id))}>×</button></div>)}</div></Context.Provider>;
}
export function useFeedback(){const value=useContext(Context);if(!value)throw new Error('useFeedback must be used inside FeedbackProvider');return value;}

