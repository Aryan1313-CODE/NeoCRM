import React, { useEffect, useState } from "react";
import { useFeedback } from "../feedback/FeedbackProvider";
import { useLoading } from "../app/LoadingProvider";
import { normalizeApiError } from "../services/api";
import { auditService } from "../services/auditService";
export function AuditLog() {
  const { push } = useFeedback();
  const { start, stop } = useLoading();
  const [events,setEvents]=useState([]),[page,setPage]=useState(1),[result,setResult]=useState("ALL"),[action,setAction]=useState("ALL");
  const limit=10;

  async function load() {
    start();
    try {
      const data=await auditService.list({page,limit,result:result==="ALL"?"":result,action:action==="ALL"?"":action});
      setEvents(Array.isArray(data)?data:(data?.data||[]));
    } catch(e){push(normalizeApiError(e).message,"error")}
    finally{stop()}
  }
  useEffect(()=>{load()},[page,result,action]);

  return <div>
    <div className="page-heading"><div><p className="eyebrow">SECURITY & COMPLIANCE</p><h1>Audit Log</h1><p>Track important user and system actions.</p></div></div>
    <section className="panel">
      <div className="filters">
        <select className="filter-btn" value={action} onChange={e=>{setPage(1);setAction(e.target.value)}}><option>ALL</option><option>LOGIN</option><option>CREATE</option><option>UPDATE</option><option>DELETE</option></select>
        <select className="filter-btn" value={result} onChange={e=>{setPage(1);setResult(e.target.value)}}><option>ALL</option><option>SUCCESS</option><option>DENIED</option></select>
      </div>
      <div className="table-wrap"><table><thead><tr><th>Actor</th><th>Action</th><th>Resource</th><th>Result</th><th>Time</th></tr></thead><tbody>{events.map(e=><tr key={e.id}><td><strong>{e.actor}</strong></td><td>{e.action}</td><td>{e.resource}</td><td><span className={`status-pill ${e.result==="SUCCESS"?"active":"inactive"}`}>{e.result}</span></td><td>{e.time}</td></tr>)}</tbody></table></div>
      <div className="table-footer pagination"><span>Page {page}</span><div><button className="filter-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Previous</button><button className="filter-btn" onClick={()=>setPage(p=>p+1)}>Next</button></div></div>
    </section>
  </div>;
}
