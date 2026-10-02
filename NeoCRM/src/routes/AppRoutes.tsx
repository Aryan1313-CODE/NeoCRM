import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { AppShell } from '../components/layout/AppShell';
import { Dashboard } from '../pages/Dashboard';
import { LoginPage } from '../pages/LoginPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { navigation, settingsNav } from '../components/layout/nav';
import { PermissionRoute } from '../permissions/PermissionRoute';
import { usePermissions } from '../permissions/PermissionProvider';
import { OrganizationPage } from '../pages/OrganizationPage';
import { UsersPage } from '../pages/UsersPage';
import { AuditPage } from '../pages/AuditPage';
import { SettingsLayout, SettingsOverview } from '../components/settings/SettingsLayout';
function AuthGate(){const {status}=useAuth();if(status==='checking')return <div className="auth-loading" role="status"><span className="loading-mark">N</span><span>Checking your session…</span></div>;return status==='authenticated'?<Outlet/>:<Navigate to="/login" replace/>;}
function LoginGate(){const {status}=useAuth();if(status==='checking')return <div className="auth-loading" role="status"><span className="loading-mark">N</span><span>Checking your session…</span></div>;return status==='authenticated'?<Navigate to="/dashboard" replace/>:<LoginPage/>;}
function AuthenticatedShell(){const {status}=usePermissions();if(status==='loading')return <div className="auth-loading" role="status"><span className="loading-mark">N</span><span>Checking workspace access…</span></div>;return <AppShell><Outlet/></AppShell>;}
export function AppRoutes(){const items=[...navigation.flatMap(section=>section.items),settingsNav];return <Routes><Route path="/login" element={<LoginGate/>}/><Route element={<AuthGate/>}><Route element={<AuthenticatedShell/>}><Route path="/" element={<Navigate to="/dashboard" replace/>}/><Route path="/dashboard" element={<PermissionRoute permission="dashboard.view"><Dashboard/></PermissionRoute>}/><Route path="/audit" element={<PermissionRoute permission="audit.view"><AuditPage/></PermissionRoute>}/>{items.filter(item=>item.path!=='/dashboard'&&item.path!=='/audit'&&item.path!=='/settings').map(item=><Route key={item.path} path={item.path} element={<PermissionRoute permission={item.permission}><PlaceholderPage/></PermissionRoute>}/>)}<Route path="/settings" element={<PermissionRoute permission="settings.view"><SettingsLayout/></PermissionRoute>}><Route index element={<PermissionRoute permission="settings.view"><SettingsOverview/></PermissionRoute>}/><Route path="users" element={<PermissionRoute permission="users.view"><UsersPage/></PermissionRoute>}/><Route path="organization" element={<PermissionRoute permission="organization.view"><OrganizationPage/></PermissionRoute>}/><Route path="*" element={<Navigate to="/settings" replace/>}/></Route><Route path="*" element={<Navigate to="/dashboard" replace/>}/></Route></Route></Routes>;}
