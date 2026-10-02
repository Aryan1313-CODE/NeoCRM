import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { PermissionRoute } from "../permissions/PermissionRoute";
import { PERMISSIONS, hasPermission } from "../permissions/permissions";
import { AppShell } from "../components/layout/AppShell";
import { SettingsLayout } from "../components/settings/SettingsLayout";
import { Login } from "../pages/Login";
import { Dashboard } from "../pages/Dashboard";
import { Customers } from "../pages/Customers";
import { UsersPage } from "../pages/UsersPage";
import { Organization } from "../pages/Organization";
import { AuditLog } from "../pages/AuditLog";
import { HealthStatus } from "../pages/HealthStatus";
import { PlaceholderPage } from "../pages/PlaceholderPage";

function ProtectedRoute(){const {isAuthenticated,loading}=useAuth();const location=useLocation();if(loading)return <div className="page-loader">Loading Chemora...</div>;if(!isAuthenticated)return <Navigate to="/login" replace state={{from:location}}/>;return <AppShell/>;}
function Module({permission,title,description}){const {user,loading}=useAuth();if(loading)return <div className="page-loader">Loading Chemora...</div>;if(!user || !hasPermission(user,permission))return <Navigate to="/unauthorized" replace/>;return <PlaceholderPage title={title} description={description}/>;}
export function AppRoutes(){return <Routes>
  <Route path="/login" element={<Login/>}/>
  <Route element={<ProtectedRoute/>}>
    <Route index element={<Navigate to="/dashboard" replace/>}/><Route path="dashboard" element={<Dashboard/>}/><Route path="customers" element={<Customers/>}/>
    <Route path="settings" element={<SettingsLayout/>}>
      <Route element={<PermissionRoute permission={PERMISSIONS.USERS}/>}><Route path="users" element={<UsersPage/>}/></Route>
      <Route element={<PermissionRoute permission={PERMISSIONS.ORG}/>}><Route path="organization" element={<Organization/>}/></Route>
    </Route>
    <Route element={<PermissionRoute permission={PERMISSIONS.AUDIT}/>}><Route path="audit" element={<AuditLog/>}/></Route><Route path="health" element={<HealthStatus/>}/>
    <Route path="leads" element={<Module permission={PERMISSIONS.LEADS} title="Leads" description="Lead management is reserved for the next CRM module increment."/>}/>
    <Route path="deals" element={<Module permission={PERMISSIONS.DEALS} title="Deals" description="Deal pipeline management is reserved for the next CRM module increment."/>}/>
    <Route path="products" element={<Module permission={PERMISSIONS.PRODUCTS} title="Products" description="Product and inventory views will connect to the operations APIs in the next increment."/>}/>
    <Route path="quotes" element={<Module permission={PERMISSIONS.QUOTES} title="Quotes" description="Quotation workflows will connect to the backend quotation APIs in the next increment."/>}/>
    <Route path="orders" element={<Module permission={PERMISSIONS.ORDERS} title="Orders" description="Order workflows will connect to inventory and dispatch services in the next increment."/>}/>
    <Route path="compliance" element={<Module permission={PERMISSIONS.COMPLIANCE} title="Compliance" description="Compliance and QC workflows are planned for the operations module increment."/>}/>
    <Route path="analytics" element={<Module permission={PERMISSIONS.ANALYTICS} title="Analytics" description="Analytics dashboards will be connected to reporting APIs in the next increment."/>}/>
    <Route path="tasks" element={<Module permission={PERMISSIONS.TASKS} title="Tasks" description="Task management will be connected to the workflow engine in the next increment."/>}/>
  </Route>
  <Route path="/unauthorized" element={<div className="center-page"><h1>403</h1><p>You do not have permission to access this page.</p></div>}/>
  <Route path="*" element={<div className="center-page"><h1>404</h1><p>This Chemora page does not exist.</p></div>}/>
</Routes>}
