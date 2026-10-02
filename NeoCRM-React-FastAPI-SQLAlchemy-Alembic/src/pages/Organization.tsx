import React, { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { useFeedback } from "../feedback/FeedbackProvider";
import { useLoading } from "../app/LoadingProvider";
import { normalizeApiError, validateRequired } from "../services/api";
import { organizationService } from "../services/organizationService";
export function Organization() {
  const { push } = useFeedback();
  const { start, stop } = useLoading();
  const [form,setForm]=useState({name:"Chemora Chemicals",industry:"Chemical Manufacturing & Distribution",location:"Bengaluru, India",currency:"INR"});
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{
    start();
    organizationService.get().then(data=>{
      if(data && Object.keys(data).length) setForm({
        name:data.name||form.name, industry:data.industry||form.industry,
        location:data.location||form.location, currency:data.currency||form.currency
      });
      setLoaded(true);
    }).catch(e=>push(normalizeApiError(e).message,"error")).finally(stop);
  },[]);

  async function save(e) {
    e.preventDefault();
    const errors=validateRequired(form);
    if(Object.keys(errors).length){push("Please complete all required fields.","error");return;}
    start();
    try { await organizationService.update(form); push("Organization settings saved successfully."); }
    catch(e){push(normalizeApiError(e).message,"error");}
    finally{stop();}
  }

  return <div>
    <div className="page-heading"><div><p className="eyebrow">SETTINGS</p><h1>Organization</h1><p>Configure the Chemora workspace identity and defaults.</p></div></div>
    <section className="panel settings-panel"><div className="settings-icon"><Building2 size={20}/></div><div className="settings-content">
      <h3>Company Profile</h3><p>{loaded?"Organization data loaded from the API.":"Loading organization..."}</p>
      <form onSubmit={save}><div className="form-grid">
        <label>Organization Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
        <label>Industry<input value={form.industry} onChange={e=>setForm({...form,industry:e.target.value})}/></label>
        <label>Primary Location<input value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></label>
        <label>Default Currency<select value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}><option>INR</option><option>USD</option><option>EUR</option></select></label>
      </div><button className="primary-btn">Save Changes</button></form>
    </div></section>
  </div>;
}
