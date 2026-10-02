import React, { useEffect, useState } from "react";
import { Download, Plus, Search } from "lucide-react";
import { useFeedback } from "../feedback/FeedbackProvider";
import { useLoading } from "../app/LoadingProvider";
import { normalizeApiError, validateRequired } from "../services/api";
import { customerService } from "../services/customerService";
import { Dialog } from "../components/ui/Dialog";
export function Customers() {
  const { push } = useFeedback();
  const { start, stop } = useLoading();
  const [customers,setCustomers]=useState([]),[search,setSearch]=useState(""),[open,setOpen]=useState(false);
  const [type,setType]=useState("ALL"),[status,setStatus]=useState("ALL");
  const [form,setForm]=useState({name:"",company:"",type:"Customer",industry:"",location:""});

  async function loadCustomers() {
    start();
    try {
      const data = await customerService.list({ search });
      setCustomers(Array.isArray(data) ? data : (data?.data || []));
    } catch(e) { push(normalizeApiError(e).message,"error"); }
    finally { stop(); }
  }

  useEffect(() => {
    const timer = setTimeout(loadCustomers, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const filtered=customers.filter(c=>(type==="ALL"||c.type===type)&&(status==="ALL"||c.status===status));

  async function create(e){
    e.preventDefault();
    const errors=validateRequired(form);
    if(Object.keys(errors).length){push("Please complete all required fields.","error");return;}
    start();
    try {
      await customerService.create(form);
      push("Customer created successfully.");
      setForm({name:"",company:"",type:"Customer",industry:"",location:""});
      setOpen(false);
      await loadCustomers();
    } catch(e) { push(normalizeApiError(e).message,"error"); }
    finally { stop(); }
  }

  function exportCsv() {
    const rows = [["Name","Company","Type","Industry","Location","Last Contact","Status"], ...filtered.map(c=>[c.name,c.company,c.type,c.industry,c.location,c.last,c.status])];
    const csv = rows.map(row=>row.map(v=>`"${String(v ?? "").replaceAll('"','""')}"`).join(",")).join("\\n");
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="customers.csv"; a.click(); URL.revokeObjectURL(url);
  }

  return <div>
    <div className="page-heading"><div><p className="eyebrow">CUSTOMER MANAGEMENT</p><h1>Contacts</h1><p>Manage customers, distributors, partners and suppliers.</p></div><div className="heading-actions"><button className="secondary-btn" onClick={exportCsv}><Download size={16}/> Export</button><button className="primary-btn" onClick={()=>setOpen(true)}><Plus size={16}/> Add Contact</button></div></div>
    <section className="panel"><div className="filters"><select className="filter-btn" value={type} onChange={e=>setType(e.target.value)}><option value="ALL">All Types</option>{["Customer","Distributor","OEM","Partner","Supplier"].map(x=><option key={x}>{x}</option>)}</select><select className="filter-btn" value={status} onChange={e=>setStatus(e.target.value)}><option value="ALL">All Statuses</option><option>Active</option><option>Inactive</option></select><div className="table-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search contacts..."/></div></div>
      <div className="table-wrap"><table><thead><tr><th>✓</th><th>Name</th><th>Company</th><th>Type</th><th>Industry</th><th>Location</th><th>Last Contact</th><th>Status</th></tr></thead><tbody>{filtered.map(c=><tr key={c.id}><td>□</td><td><div className="person"><div className="avatar small">{c.name.split(" ").map(x=>x[0]).join("")}</div><strong>{c.name}</strong></div></td><td>{c.company}</td><td><span className="type-tag">{c.type}</span></td><td>{c.industry}</td><td>{c.location}</td><td>{c.last ? (c.last === "Never" ? c.last : new Date(c.last).toLocaleDateString()) : "Never"}</td><td><span className={`status-pill ${String(c.status).toLowerCase()}`}>{c.status}</span></td></tr>)}</tbody></table></div>
      <div className="table-footer">Showing 1–{filtered.length} of {customers.length}</div>
    </section>
    <Dialog open={open} title="Add Customer" onClose={()=>setOpen(false)}><form className="modal-form" onSubmit={create}>{[["name","Contact Name"],["company","Company"],["industry","Industry"],["location","Location"]].map(([key,label])=><label key={key}>{label}<input required value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}<label>Type<select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option>Customer</option><option>Distributor</option><option>OEM</option><option>Partner</option><option>Supplier</option></select></label><button className="primary-btn full">Create Contact</button></form></Dialog>
  </div>;
}
