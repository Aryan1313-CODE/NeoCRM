import React, { useEffect, useState } from "react";
import { healthCheck } from "../services/api";
export function HealthStatus() {
  const [state,setState]=useState({checking:true,online:false,status:0});
  useEffect(()=>{
    healthCheck().then((result) => {
      setState({ checking: false, online: result.online, status: result.status });
    }).catch(() => {
      setState({ checking: false, online: false, status: 0 });
    });
  },[]);
  return <div><div className="page-heading"><div><p className="eyebrow">PLATFORM</p><h1>System Health</h1><p>Frontend connectivity check for the backend service.</p></div></div>
    <section className="panel health-card"><div className={`health-dot ${state.online?"online":"offline"}`}></div><div><h3>{state.checking?"Checking backend...":state.online?"Backend Online":"Backend Unavailable"}</h3><p>GET /health · HTTP {state.status||"—"}</p></div></section>
  </div>;
}
