import { useEffect, useId, useRef, type ReactNode } from 'react';
type Props={open:boolean;title:string;onClose:()=>void;children:ReactNode;size?:'regular'|'wide'};
export function Dialog({open,title,onClose,children,size='regular'}:Props){
 const dialogRef=useRef<HTMLDivElement>(null);const closeRef=useRef(onClose);closeRef.current=onClose;const titleId=useId();
 useEffect(()=>{if(!open)return;const previous=document.activeElement as HTMLElement|null;const dialog=dialogRef.current;dialog?.querySelector<HTMLElement>('[data-autofocus],input,select,button')?.focus();const onKey=(event:globalThis.KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();closeRef.current();return;}if(event.key!=='Tab'||!dialog)return;const focusable=[...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[href],[tabindex]:not([tabindex="-1"])')];if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}};document.addEventListener('keydown',onKey);document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',onKey);document.body.style.overflow='';previous?.focus();};},[open]);
 if(!open)return null;return <div className="dialog-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}><div ref={dialogRef} className={`dialog dialog-${size}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}><div className="dialog-header"><div><p className="eyebrow">CHEMORA GROUP</p><h2 id={titleId}>{title}</h2></div><button className="dialog-close" aria-label="Close dialog" onClick={onClose}>×</button></div>{children}</div></div>;
}



