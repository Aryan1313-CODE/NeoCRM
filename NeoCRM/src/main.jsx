import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  ArrowRight, ArrowUpRight, BarChart3, Bell, Building2, ChevronDown,
  ClipboardCheck, Download, FileCheck2, Gauge, IndianRupee, LayoutDashboard,
  Package, Plus, Search, Settings, ShieldCheck, SlidersHorizontal,
  Target, Tags, UserRound, Users, X
} from "lucide-react";
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import "./styles.css";

/* ---------- API ---------- */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const USE_MOCK_API = String(import.meta.env.VITE_USE_MOCK_API ?? "true") === "true";

async function apiRequest(path, options = {}) {
  if (USE_MOCK_API) return mockRequest(path, options);

  const token = localStorage.getItem("chemora_access_token");
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  let data = null;
  try { data = await response.json(); } catch {}
  if (!response.ok) {
    const error = new Error(data?.message || data?.detail || "API request failed");
    error.status = response.status;
    if (response.status === 401) {
      localStorage.removeItem("chemora_access_token");
      localStorage.removeItem("chemora_user");
      window.dispatchEvent(new Event("chemora:session-expired"));
    }
    throw error;
  }
  return data;
}

function mockRequest(path, options = {}) {
  const method = options.method || "GET";
  if (path === "/auth/login" && method === "POST") {
    const body = JSON.parse(options.body || "{}");
    return Promise.resolve({
      access_token: "demo-token",
      user: {
        id: "usr-001",
        name: body.email?.split("@")[0] || "Riddima Singh",
        email: body.email || "riddima@chemora.com",
        role: "sales_manager",
        organization: "Chemora Chemicals"
      }
    });
  }
  if (path === "/auth/me") {
    const value = localStorage.getItem("chemora_user");
    return Promise.resolve(value ? JSON.parse(value) : null);
  }
  if (path === "/users") return Promise.resolve([
    {id:"u1",name:"Riddima Singh",email:"riddima@chemora.com",role:"sales_manager",status:"Active"},
    {id:"u2",name:"Amit Verma",email:"amit@chemora.com",role:"sales",status:"Active"},
    {id:"u3",name:"Neha Kapoor",email:"neha@chemora.com",role:"inventory",status:"Active"}
  ]);
  if (path === "/audit") return Promise.resolve([
    {id:1,actor:"Riddima Singh",action:"LOGIN",resource:"Auth",result:"SUCCESS",time:"2 min ago"},
    {id:2,actor:"Amit Verma",action:"CREATE",resource:"Customer",result:"SUCCESS",time:"18 min ago"},
    {id:3,actor:"Neha Kapoor",action:"UPDATE",resource:"Inventory",result:"SUCCESS",time:"42 min ago"},
    {id:4,actor:"Unknown",action:"DELETE",resource:"User",result:"DENIED",time:"1 hr ago"}
  ]);
  return Promise.resolve({});
}

const api = {
  get: path => apiRequest(path, {method:"GET"}),
  post: (path, body) => apiRequest(path, {method:"POST", body:JSON.stringify(body)}),
  put: (path, body) => apiRequest(path, {method:"PUT", body:JSON.stringify(body)}),
  delete: path => apiRequest(path, {method:"DELETE"})
};


/* ---------- Platform utilities ---------- */
function normalizeApiError(error) {
  const status = error?.status;
  if (status === 401) return { code: "UNAUTHORIZED", message: "Your session has expired. Please sign in again." };
  if (status === 403) return { code: "FORBIDDEN", message: "You do not have permission to perform this action." };
  if (status === 404) return { code: "NOT_FOUND", message: "The requested resource was not found." };
  if (status === 409) return { code: "CONFLICT", message: "This operation conflicts with existing data." };
  if (status === 422) return { code: "VALIDATION", message: "Please check the submitted fields." };
  if (status >= 500) return { code: "SERVER", message: "The server encountered an error." };
  return { code: "UNKNOWN", message: error?.message || "Something went wrong." };
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });
  return query.toString();
}

async function apiList(path, params = {}) {
  const qs = buildQuery(params);
  return api.get(qs ? `${path}?${qs}` : path);
}

async function healthCheck() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return { online: response.ok, status: response.status };
  } catch {
    return { online: false, status: 0 };
  }
}

function validateRequired(fields) {
  const errors = {};
  Object.entries(fields).forEach(([name, value]) => {
    if (typeof value === "string" && !value.trim()) errors[name] = "Required";
    if (value === null || value === undefined) errors[name] = "Required";
  });
  return errors;
}

/* ---------- Toasts ---------- */
const ToastContext = createContext(null);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  function push(message, type = "success") {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }
  return <ToastContext.Provider value={{ push }}>
    {children}
    <div className="toast-stack">
      {toasts.map(t => <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>)}
    </div>
  </ToastContext.Provider>;
}

function useToast() {
  const c = useContext(ToastContext);
  if (!c) throw new Error("useToast must be inside ToastProvider");
  return c;
}

/* ---------- Permission guard ---------- */
function PermissionGuard({ permission, children, fallback = null }) {
  const { user } = useAuth();
  return hasPermission(user, permission) ? children : fallback;
}

/* ---------- Global loading ---------- */
const LoadingContext = createContext(null);

function LoadingProvider({ children }) {
  const [loadingCount, setLoadingCount] = useState(0);
  const start = () => setLoadingCount(c => c + 1);
  const stop = () => setLoadingCount(c => Math.max(0, c - 1));
  return <LoadingContext.Provider value={{ start, stop, loading: loadingCount > 0 }}>
    {children}
    {loadingCount > 0 && <div className="global-loading"><span>Working...</span></div>}
  </LoadingContext.Provider>;
}

function useLoading() {
  const c = useContext(LoadingContext);
  if (!c) throw new Error("useLoading must be inside LoadingProvider");
  return c;
}

/* ---------- Auth / RBAC ---------- */
const PERMISSIONS = {
  DASHBOARD:"dashboard.view", CUSTOMERS:"customers.view", CUSTOMERS_WRITE:"customers.write",
  LEADS:"leads.view", DEALS:"deals.view", PRODUCTS:"products.view", QUOTES:"quotes.view",
  ORDERS:"orders.view", COMPLIANCE:"compliance.view", ANALYTICS:"analytics.view",
  TASKS:"tasks.view", USERS:"users.view", AUDIT:"audit.view", ORG:"organization.manage"
};

const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS),
  sales_manager: [PERMISSIONS.DASHBOARD,PERMISSIONS.CUSTOMERS,PERMISSIONS.CUSTOMERS_WRITE,PERMISSIONS.LEADS,PERMISSIONS.DEALS,PERMISSIONS.PRODUCTS,PERMISSIONS.QUOTES,PERMISSIONS.ORDERS,PERMISSIONS.COMPLIANCE,PERMISSIONS.ANALYTICS,PERMISSIONS.TASKS],
  sales: [PERMISSIONS.DASHBOARD,PERMISSIONS.CUSTOMERS,PERMISSIONS.CUSTOMERS_WRITE,PERMISSIONS.LEADS,PERMISSIONS.DEALS,PERMISSIONS.PRODUCTS,PERMISSIONS.QUOTES,PERMISSIONS.TASKS],
  inventory: [PERMISSIONS.DASHBOARD,PERMISSIONS.PRODUCTS,PERMISSIONS.ORDERS,PERMISSIONS.COMPLIANCE],
  auditor: [PERMISSIONS.DASHBOARD,PERMISSIONS.AUDIT,PERMISSIONS.ANALYTICS]
};

function hasPermission(user, permission) {
  return Boolean(user && ROLE_PERMISSIONS[user.role]?.includes(permission));
}

const AuthContext = createContext(null);

function AuthProvider({children}) {
  const [user,setUser] = useState(null);
  const [loading,setLoading] = useState(true);

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener("chemora:session-expired", onExpired);
    return () => window.removeEventListener("chemora:session-expired", onExpired);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("chemora_access_token");
    const stored = localStorage.getItem("chemora_user");
    if (!token || !stored) { setLoading(false); return; }
    api.get("/auth/me")
      .then(u => setUser(u || JSON.parse(stored)))
      .catch(() => { localStorage.clear(); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  async function login(email,password) {
    const data = await api.post("/auth/login",{email,password});
    localStorage.setItem("chemora_access_token",data.access_token);
    localStorage.setItem("chemora_user",JSON.stringify(data.user));
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem("chemora_access_token");
    localStorage.removeItem("chemora_user");
    setUser(null);
  }

  const value = useMemo(() => ({user,loading,isAuthenticated:Boolean(user),login,logout}),[user,loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}

/* ---------- Shared UI ---------- */
function Modal({open,title,onClose,children}) {
  if (!open) return null;
  return <div className="modal-backdrop" onMouseDown={onClose}>
    <div className="modal-card" onMouseDown={e=>e.stopPropagation()}>
      <div className="modal-header"><h3>{title}</h3><button className="icon-btn" onClick={onClose}><X size={18}/></button></div>
      {children}
    </div>
  </div>;
}

const nav = [
  ["Dashboard","/dashboard",LayoutDashboard,PERMISSIONS.DASHBOARD],
  ["Customers","/customers",Users,PERMISSIONS.CUSTOMERS],
  ["Leads","#",UserRound,PERMISSIONS.LEADS],
  ["Deals","#",Gauge,PERMISSIONS.DEALS],
  ["Products","#",Package,PERMISSIONS.PRODUCTS],
  ["Quotes","#",FileCheck2,PERMISSIONS.QUOTES],
  ["Orders","#",Tags,PERMISSIONS.ORDERS],
  ["Compliance","#",ClipboardCheck,PERMISSIONS.COMPLIANCE],
  ["Analytics","#",BarChart3,PERMISSIONS.ANALYTICS],
  ["Tasks","#",Tags,PERMISSIONS.TASKS]
];

function Sidebar() {
  const {user} = useAuth();
  return <aside className="sidebar">
    <div className="brand">CHEMORA</div>
    <nav className="side-nav">
      {nav.filter(x=>hasPermission(user,x[3])).map(([label,path,Icon]) =>
        path === "#" ?
        <div className="nav-item disabled-nav" key={label}><Icon size={17}/><span>{label}</span></div> :
        <NavLink key={label} to={path} className={({isActive})=>`nav-item ${isActive?"active":""}`}><Icon size={17}/><span>{label}</span></NavLink>
      )}
    </nav>
    <div className="sidebar-bottom">
      {hasPermission(user,PERMISSIONS.AUDIT) && <NavLink to="/audit" className="nav-item"><ClipboardCheck size={17}/><span>Audit Log</span></NavLink>}
      {hasPermission(user,PERMISSIONS.USERS) && <NavLink to="/settings/users" className="nav-item"><Users size={17}/><span>Users</span></NavLink>}
      {hasPermission(user,PERMISSIONS.ORG) && <NavLink to="/settings/organization" className="nav-item"><Settings size={17}/><span>Settings</span></NavLink>}
    </div>
  </aside>;
}

function Topbar() {
  const {user,logout} = useAuth();
  return <header className="topbar">
    <div className="search-box"><Search size={16}/><input placeholder="Search customers, products, deals..."/></div>
    <div className="topbar-right">
      <button className="icon-btn"><Bell size={18}/></button>
      <div className="profile">
        <div className="avatar">{user?.name?.slice(0,2).toUpperCase()}</div>
        <div className="profile-copy"><strong>{user?.name}</strong><span>{user?.role?.replace("_"," ")}</span></div>
        <button className="profile-menu" onClick={logout}><ChevronDown size={16}/></button>
      </div>
    </div>
  </header>;
}

function DashboardLayout() {
  return <div className="app-shell"><Sidebar/><main className="main-area"><Topbar/><div className="content-area"><Outlet/></div></main></div>;
}

function ProtectedRoute() {
  const {isAuthenticated,loading}=useAuth();
  const location=useLocation();
  if (loading) return <div className="page-loader">Loading Chemora...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{from:location}}/>;
  return <Outlet/>;
}

function PermissionRoute({ permission }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-loader">Loading Chemora...</div>;
  if (!hasPermission(user, permission)) return <Navigate to="/unauthorized" replace state={{from: location}} />;
  return <Outlet />;
}


/* ---------- Pages ---------- */
function Login() {
  const {login,isAuthenticated}=useAuth();
  const navigate=useNavigate();
  const location=useLocation();
  const [email,setEmail]=useState("riddima@chemora.com");
  const [password,setPassword]=useState("demo");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  useEffect(()=>{if(isAuthenticated) navigate("/dashboard",{replace:true})},[isAuthenticated,navigate]);

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    try { await login(email,password); navigate(location.state?.from?.pathname||"/dashboard",{replace:true}); }
    catch(err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return <div className="login-page">
    <div className="login-visual">
      <div className="visual-brand">CHEMORA</div>
      <div className="visual-copy">
        <p>THE CHEMICAL INDUSTRY CRM</p>
        <h1>Stronger Relationships<br/>Create a Cleaner <em>Tomorrow.</em></h1>
        <span>Sales, customers, products and operations — connected in one platform.</span>
      </div>
    </div>
    <div className="login-panel">
      <div className="login-card">
        <div className="mini-brand">CHEMORA</div>
        <p className="eyebrow">WELCOME BACK</p>
        <h2>Sign in to your workspace</h2>
        <p className="muted">Manage your chemical business from one place.</p>
        <form onSubmit={submit}>
          <label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
          <label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-btn full" disabled={busy}>{busy?"Signing in...":"Sign In"}<ArrowRight size={17}/></button>
        </form>
        <div className="secure-note"><ShieldCheck size={16}/> Protected by Chemora authentication & RBAC</div>
      </div>
    </div>
  </div>;
}

const activities=[
  ["New lead from Reliance Industries","2 hours ago"],
  ["Quote sent to Aarti Chemicals","4 hours ago"],
  ["Deal moved to Negotiation — Acme Petrochem","6 hours ago"],
  ["SDS document uploaded for Product: MEK","1 day ago"]
];

function Dashboard() {
  const stats=[
    ["Total Customers","248","+12%",Users],
    ["Active Leads","86","+18%",Target],
    ["Pipeline Value","₹ 12.4 Cr","+24%",IndianRupee],
    ["Quotes Sent","64","+14%",FileCheck2],
    ["Conversion Rate","18.6%","+4.2%",Package]
  ];
  return <div>
    <div className="page-heading">
      <div><p className="eyebrow">SALES OVERVIEW</p><h1>Good morning, Riddima 👋</h1><p>Here’s what’s happening in your chemical business today.</p></div>
      <select className="period-select"><option>This Month</option><option>This Quarter</option><option>This Year</option></select>
    </div>
    <div className="stats-grid">{stats.map(([label,value,delta,Icon])=><div className="stat-card" key={label}><div className="stat-icon"><Icon size={18}/></div><div><span>{label}</span><strong>{value}</strong><small><ArrowUpRight size={12}/> {delta}</small></div></div>)}</div>
    <div className="dashboard-grid">
      <section className="panel chart-panel"><div className="panel-heading"><div><h3>Sales Overview</h3><span>Pipeline movement across the current period</span></div><select className="small-select"><option>Revenue</option><option>Deals</option></select></div>
        <div className="chart"><div className="chart-grid">{[20,15,10,5,0].map(n=><span key={n}>{n}</span>)}</div><svg viewBox="0 0 600 230" preserveAspectRatio="none" className="line-chart"><path d="M0 190 C45 160,65 180,105 155 S165 185,205 130 S275 155,315 105 S390 135,430 95 S500 115,600 42 L600 230 L0 230 Z"/><path className="line-stroke" d="M0 190 C45 160,65 180,105 155 S165 185,205 130 S275 155,315 105 S390 135,430 95 S500 115,600 42"/></svg><div className="chart-labels">{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep"].map(x=><span key={x}>{x}</span>)}</div></div>
      </section>
      <section className="panel activity-panel"><div className="panel-heading"><div><h3>Recent Activity</h3><span>Latest workspace events</span></div><button className="text-btn">View all</button></div><div className="activity-list">{activities.map(([title,time])=><div className="activity-row" key={title}><div className="activity-dot"><FileCheck2 size={15}/></div><div><strong>{title}</strong><span>{time}</span></div></div>)}</div></section>
    </div>
    <section className="panel"><div className="panel-heading"><div><h3>Implementation milestone</h3><span>Days 1–6 frontend foundation</span></div><span className="status-pill active">Foundation Ready</span></div>
      <div className="milestones">{[["01","App shell","Layout, sidebar, routing"],["02","Authentication","Login, session, logout"],["03","RBAC","Permission-aware navigation"],["04","Users & Org","Admin management UI"],["05","Audit","Activity/audit interface"],["06","API Layer","Central client + errors"]].map(x=><div className="milestone" key={x[0]}><span>{x[0]}</span><div><strong>{x[1]}</strong><small>{x[2]}</small></div></div>)}</div>
    </section>
  </div>;
}

const initialCustomers=[
 {id:1,name:"Amit Verma",company:"Reliance Industries",type:"OEM",industry:"Petrochemicals",location:"Mumbai",last:"Today",status:"Active"},
 {id:2,name:"Priya Shah",company:"Aarti Chemicals",type:"Distributor",industry:"Specialty Chemicals",location:"Gujarat",last:"Yesterday",status:"Active"},
 {id:3,name:"Karan Mehta",company:"UPL Ltd.",type:"Bulk Buyer",industry:"Agrochemicals",location:"Mumbai",last:"2 days ago",status:"Inactive"},
 {id:4,name:"Sneha Iyer",company:"Tata Chemicals",type:"Partner",industry:"Industrial Chemicals",location:"Delhi",last:"4 days ago",status:"Active"},
 {id:5,name:"Vikram Rao",company:"SRF Ltd.",type:"Supplier",industry:"Fluorochemicals",location:"Bengaluru",last:"1 week ago",status:"Active"},
 {id:6,name:"Neha Kapoor",company:"Galaxy Surfactants",type:"Customer",industry:"Surfactants",location:"Mumbai",last:"1 week ago",status:"Inactive"}
];

function Customers() {
  const [customers,setCustomers]=useState(initialCustomers),[search,setSearch]=useState(""),[open,setOpen]=useState(false);
  const [form,setForm]=useState({name:"",company:"",type:"Customer",industry:"",location:""});
  const filtered=customers.filter(c=>[c.name,c.company,c.type,c.industry,c.location].some(v=>v.toLowerCase().includes(search.toLowerCase())));
  function create(e){e.preventDefault();setCustomers(p=>[...p,{...form,id:Date.now(),last:"Just now",status:"Active"}]);setForm({name:"",company:"",type:"Customer",industry:"",location:""});setOpen(false);}
  return <div>
    <div className="page-heading"><div><p className="eyebrow">CUSTOMER MANAGEMENT</p><h1>Contacts</h1><p>Manage customers, distributors, partners and suppliers.</p></div><div className="heading-actions"><button className="secondary-btn"><Download size={16}/> Export</button><button className="primary-btn" onClick={()=>setOpen(true)}><Plus size={16}/> Add Contact</button></div></div>
    <section className="panel"><div className="filters"><button className="filter-btn">All Segments</button><button className="filter-btn">All Types</button><button className="filter-btn">All Locations</button><div className="table-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search contacts..."/></div><button className="filter-btn"><SlidersHorizontal size={15}/> Filters</button></div>
      <div className="table-wrap"><table><thead><tr><th>✓</th><th>Name</th><th>Company</th><th>Type</th><th>Industry</th><th>Location</th><th>Last Contact</th><th>Status</th></tr></thead><tbody>{filtered.map(c=><tr key={c.id}><td>□</td><td><div className="person"><div className="avatar small">{c.name.split(" ").map(x=>x[0]).join("")}</div><strong>{c.name}</strong></div></td><td>{c.company}</td><td><span className="type-tag">{c.type}</span></td><td>{c.industry}</td><td>{c.location}</td><td>{c.last}</td><td><span className={`status-pill ${c.status.toLowerCase()}`}>{c.status}</span></td></tr>)}</tbody></table></div>
      <div className="table-footer">Showing 1–{filtered.length} of {customers.length}</div>
    </section>
    <Modal open={open} title="Add Customer" onClose={()=>setOpen(false)}><form className="modal-form" onSubmit={create}>{[["name","Contact Name"],["company","Company"],["industry","Industry"],["location","Location"]].map(([key,label])=><label key={key}>{label}<input required value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}<label>Type<select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option>Customer</option><option>Distributor</option><option>OEM</option><option>Partner</option><option>Supplier</option></select></label><button className="primary-btn full">Create Contact</button></form></Modal>
  </div>;
}

function UsersPage() {
  const { push } = useToast();
  const { start, stop } = useLoading();
  const [users,setUsers]=useState([]),[open,setOpen]=useState(false),[editing,setEditing]=useState(null);
  const empty={name:"",email:"",role:"sales",status:"Active"};

  async function loadUsers() {
    start();
    try { setUsers(await api.get("/users")); }
    catch (e) { push(normalizeApiError(e).message,"error"); }
    finally { stop(); }
  }

  useEffect(()=>{loadUsers()},[]);

  async function saveUser(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      role: form.get("role"),
      status: form.get("status")
    };
    const errors = validateRequired(payload);
    if (Object.keys(errors).length) { push("Please complete all required fields.","error"); return; }

    start();
    try {
      if (editing) {
        await api.put(`/users/${editing.id}`, payload);
        push("User updated successfully.");
      } else {
        await api.post("/users", payload);
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
      await api.delete(`/users/${user.id}`);
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
    <Modal open={open} title={editing?"Edit User":"Add User"} onClose={()=>{setOpen(false);setEditing(null)}}>
      <form className="modal-form" onSubmit={saveUser}>
        <label>Name<input name="name" required defaultValue={editing?.name||""} placeholder="Full name"/></label>
        <label>Email<input name="email" required type="email" defaultValue={editing?.email||""} placeholder="user@company.com"/></label>
        <label>Role<select name="role" defaultValue={editing?.role||"sales"}><option value="sales">Sales</option><option value="sales_manager">Sales Manager</option><option value="inventory">Inventory</option><option value="auditor">Auditor</option><option value="admin">Admin</option></select></label>
        <label>Status<select name="status" defaultValue={editing?.status||"Active"}><option>Active</option><option>Inactive</option></select></label>
        <button className="primary-btn full">{editing?"Save Changes":"Create User"}</button>
      </form>
    </Modal>
  </div>;
}

function Organization() {
  const { push } = useToast();
  const { start, stop } = useLoading();
  const [form,setForm]=useState({name:"Chemora Chemicals",industry:"Chemical Manufacturing & Distribution",location:"Bengaluru, India",currency:"INR"});
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{
    start();
    api.get("/organization").then(data=>{
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
    try { await api.put("/organization",form); push("Organization settings saved successfully."); }
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

function AuditLog() {
  const { push } = useToast();
  const { start, stop } = useLoading();
  const [events,setEvents]=useState([]),[page,setPage]=useState(1),[result,setResult]=useState("ALL"),[action,setAction]=useState("ALL");
  const limit=10;

  async function load() {
    start();
    try {
      const data=await apiList("/audit",{page,limit,result:result==="ALL"?"":result,action:action==="ALL"?"":action});
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


function HealthStatus() {
  const { push } = useToast();
  const [state,setState]=useState({checking:true,online:false,status:0});
  useEffect(()=>{healthCheck().then(setState)},[]);
  return <div><div className="page-heading"><div><p className="eyebrow">PLATFORM</p><h1>System Health</h1><p>Frontend connectivity check for the backend service.</p></div></div>
    <section className="panel health-card"><div className={`health-dot ${state.online?"online":"offline"}`}></div><div><h3>{state.checking?"Checking backend...":state.online?"Backend Online":"Backend Unavailable"}</h3><p>GET /health · HTTP {state.status||"—"}</p></div></section>
  </div>;
}

function App() {
  return <AuthProvider><LoadingProvider><ToastProvider><BrowserRouter><Routes>
    <Route path="/login" element={<Login/>}/>
    <Route element={<ProtectedRoute/>}><Route element={<DashboardLayout/>}>
      <Route index element={<Navigate to="/dashboard" replace/>}/>
      <Route path="/dashboard" element={<Dashboard/>}/>
      <Route path="/customers" element={<Customers/>}/>
      <Route element={<PermissionRoute permission={PERMISSIONS.USERS}/>}><Route path="/settings/users" element={<UsersPage/>}/></Route>
      <Route element={<PermissionRoute permission={PERMISSIONS.ORG}/>}><Route path="/settings/organization" element={<Organization/>}/></Route>
      <Route element={<PermissionRoute permission={PERMISSIONS.AUDIT}/>}><Route path="/audit" element={<AuditLog/>}/></Route>
      <Route path="/health" element={<HealthStatus/>}/>
    </Route></Route>
    <Route path="/unauthorized" element={<div className="center-page"><h1>403</h1><p>You do not have permission to access this page.</p></div>}/>
    <Route path="*" element={<div className="center-page"><h1>404</h1><p>This Chemora page does not exist.</p></div>}/>
  </Routes></BrowserRouter></ToastProvider></LoadingProvider></AuthProvider>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<React.StrictMode><App/></React.StrictMode>);
