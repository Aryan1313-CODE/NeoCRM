import React, { useEffect, useState } from "react";
import { ArrowUpRight, FileCheck2, IndianRupee, Package, Target, Users } from "lucide-react";
import { useFeedback } from "../feedback/FeedbackProvider";
import { useLoading } from "../app/LoadingProvider";
import { normalizeApiError } from "../services/api";
import { dashboardService } from "../services/dashboardService";
export function Dashboard() {
  const { push } = useFeedback();
  const { start, stop } = useLoading();
  const [summary, setSummary] = useState(null);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    let active = true;
    start();
    Promise.all([dashboardService.summary(), dashboardService.recentActivity()])
      .then(([data, audit]) => {
        if (!active) return;
        setSummary(data);
        setActivities(Array.isArray(audit) ? audit.map(e => [
          `${e.action} — ${e.resource}`,
          e.time ? new Date(e.time).toLocaleString() : "Recently"
        ]) : []);
      })
      .catch(e => { if (active) push(normalizeApiError(e).message, "error"); })
      .finally(() => { if (active) stop(); });
    return () => { active = false; };
  }, []);

  const stats=[
    ["Total Customers", summary?.totalCustomers ?? "—", "+12%", Users],
    ["Active Leads", summary?.activeLeads ?? "—", "+18%", Target],
    ["Pipeline Value", summary ? `₹ ${(Number(summary.pipelineValue || 0) / 10000000).toFixed(1)} Cr` : "—", "+24%", IndianRupee],
    ["Quotes Sent", summary?.quotesSent ?? "—", "+14%", FileCheck2],
    ["Conversion Rate", summary ? `${summary.conversionRate}%` : "—", "+4.2%", Package]
  ];
  return <div>
    <div className="page-heading">
      <div><p className="eyebrow">SALES OVERVIEW</p><h1>Good morning 👋</h1><p>Here’s what’s happening in your chemical business today.</p></div>
      <select className="period-select"><option>This Month</option><option>This Quarter</option><option>This Year</option></select>
    </div>
    <div className="stats-grid">{stats.map(([label,value,delta,Icon])=><div className="stat-card" key={label}><div className="stat-icon"><Icon size={18}/></div><div><span>{label}</span><strong>{value}</strong><small><ArrowUpRight size={12}/> {delta}</small></div></div>)}</div>
    <div className="dashboard-grid">
      <section className="panel chart-panel"><div className="panel-heading"><div><h3>Sales Overview</h3><span>Pipeline movement across the current period</span></div><select className="small-select"><option>Revenue</option><option>Deals</option></select></div>
        <div className="chart"><div className="chart-grid">{[20,15,10,5,0].map(n=><span key={n}>{n}</span>)}</div><svg viewBox="0 0 600 230" preserveAspectRatio="none" className="line-chart"><path d="M0 190 C45 160,65 180,105 155 S165 185,205 130 S275 155,315 105 S390 135,430 95 S500 115,600 42 L600 230 L0 230 Z"/><path className="line-stroke" d="M0 190 C45 160,65 180,105 155 S165 185,205 130 S275 155,315 105 S390 135,430 95 S500 115,600 42"/></svg><div className="chart-labels">{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep"].map(x=><span key={x}>{x}</span>)}</div></div>
      </section>
      <section className="panel activity-panel"><div className="panel-heading"><div><h3>Recent Activity</h3><span>Latest workspace events from the audit API</span></div></div><div className="activity-list">{activities.length ? activities.map(([title,time], i)=><div className="activity-row" key={`${title}-${i}`}><div className="activity-dot"><FileCheck2 size={15}/></div><div><strong>{title}</strong><span>{time}</span></div></div>) : <div className="activity-row"><div><strong>No activity yet</strong><span>Actions will appear here as users interact with the system.</span></div></div>}</div></section>
    </div>
    <section className="panel"><div className="panel-heading"><div><h3>Implementation milestone</h3><span>Days 1–6 full-stack foundation</span></div><span className="status-pill active">Backend Connected</span></div>
      <div className="milestones">{[["01","App shell","Layout, sidebar, routing"],["02","Authentication","Login, session, logout"],["03","RBAC","Permission-aware navigation"],["04","Users & Org","Admin management UI"],["05","Audit","Activity/audit interface"],["06","API + DB","PostgreSQL + SQLAlchemy + Alembic"]].map(x=><div className="milestone" key={x[0]}><span>{x[0]}</span><div><strong>{x[1]}</strong><small>{x[2]}</small></div></div>)}</div>
    </section>
  </div>;
}
