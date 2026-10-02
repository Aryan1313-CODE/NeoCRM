import React, { useEffect, useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import { useFeedback } from "../feedback/FeedbackProvider";
import { useLoading } from "../app/LoadingProvider";
import { normalizeApiError, validateRequired } from "../services/api";
import { userService } from "../services/userService";
import { Dialog } from "../components/ui/Dialog";
export function UsersPage() {
  const { push } = useFeedback();
  const { start, stop } = useLoading();
  const [users,setUsers]=useState([]),[open,setOpen]=useState(false),[editing,setEditing]=useState(null);
  const empty={name:"",email:"",role:"sales",status:"Active"};

  async function loadUsers() {
    start();
    try { setUsers(await userService.list()); }
    catch (e) { push(normalizeApiError(e).message,"error"); }
    finally { stop(); }
  }

  useEffect(()=>{loadUsers()},[]);

  async function saveUser(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      role: String(form.get("role") ?? ""),
      status: String(form.get("status") ?? "")
    };
    const errors = validateRequired(payload);
    if (Object.keys(errors).length) { push("Please complete all required fields.","error"); return; }

    start();
    try {
      if (editing) {
        await userService.update(editing.id, payload);
        push("User updated successfully.");
      } else {
        await userService.create(payload);
        push("User created successfully.");
      }
      setOpen(false); setEditing(null); await loadUsers();
    } catch (e) {
      push(normalizeApiError(e).message,"error");
    } finally { stop(); }
  }

  async function deactivateUser(user) {
    if (!window.confirm(`Deactivate ${user.name}?`)) return;
    start();
    try {
      await userService.deactivate(user.id);
      push("User deactivated successfully.");
      await loadUsers();
    } catch (e) {
      push(normalizeApiError(e).message,"error");
    } finally { stop(); }
  }

  return <div>
    <div className="page-heading">
      <div><p className="eyebrow">ADMINISTRATION</p><h1>Users & Roles</h1><p>Manage workspace members and their access levels.</p></div>
      <button className="primary-btn" onClick={()=>{setEditing(null);setOpen(true)}}><Plus size={16}/> Add User</button>
    </div>
    <section className="panel">
      <div className="panel-heading"><div><h3>Workspace Users</h3><span>Backend authorization remains the final security authority.</span></div></div>
      <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Access</th><th>Actions</th></tr></thead>
      <tbody>{users.map(u=><tr key={u.id}>
        <td><strong>{u.name}</strong></td><td>{u.email}</td><td><span className="type-tag">{u.role.replace("_"," ")}</span></td>
        <td><span className={`status-pill ${u.status==="Active"?"active":"inactive"}`}>{u.status}</span></td>
        <td><span className="access-cell"><ShieldCheck size={15}/> RBAC</span></td>
        <td><button className="table-action" onClick={()=>{setEditing(u);setOpen(true)}}>Edit</button><button className="table-action danger" onClick={()=>deactivateUser(u)}>Deactivate</button></td>
      </tr>)}</tbody></table></div>
    </section>
    <Dialog open={open} title={editing?"Edit User":"Add User"} onClose={()=>{setOpen(false);setEditing(null)}}>
      <form className="modal-form" onSubmit={saveUser}>
        <label>Name<input name="name" required defaultValue={editing?.name||""} placeholder="Full name"/></label>
        <label>Email<input name="email" required type="email" defaultValue={editing?.email||""} placeholder="user@company.com"/></label>
        <label>Role<select name="role" defaultValue={editing?.role||"sales"}><option value="sales">Sales</option><option value="sales_manager">Sales Manager</option><option value="inventory">Inventory</option><option value="auditor">Auditor</option><option value="admin">Admin</option></select></label>
        <label>Status<select name="status" defaultValue={editing?.status||"Active"}><option>Active</option><option>Inactive</option></select></label>
        <button className="primary-btn full">{editing?"Save Changes":"Create User"}</button>
      </form>
    </Dialog>
  </div>;
}
