import React from "react";
import { BarChart3, ClipboardCheck, FileCheck2, Gauge, LayoutDashboard, Package, Settings, Tags, UserRound, Users, type LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { usePermissions } from "../../permissions/PermissionProvider";
import { PERMISSIONS } from "../../permissions/permissions";

type NavItem = [label: string, path: string, icon: LucideIcon, permission: string];

const nav: NavItem[] = [
  ["Dashboard", "/dashboard", LayoutDashboard, PERMISSIONS.DASHBOARD],
  ["Customers", "/customers", Users, PERMISSIONS.CUSTOMERS],
  ["Leads", "/leads", UserRound, PERMISSIONS.LEADS], ["Deals", "/deals", Gauge, PERMISSIONS.DEALS],
  ["Products", "/products", Package, PERMISSIONS.PRODUCTS], ["Quotes", "/quotes", FileCheck2, PERMISSIONS.QUOTES],
  ["Orders", "/orders", Tags, PERMISSIONS.ORDERS], ["Compliance", "/compliance", ClipboardCheck, PERMISSIONS.COMPLIANCE],
  ["Analytics", "/analytics", BarChart3, PERMISSIONS.ANALYTICS], ["Tasks", "/tasks", Tags, PERMISSIONS.TASKS]
];

export function Sidebar() {
  const { can } = usePermissions();
  return <aside className="sidebar"><div className="brand">CHEMORA</div><nav className="side-nav">
    {nav.filter(item => can(item[3])).map(([label, path, Icon]) => <NavLink key={label} to={path} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}><Icon size={17}/><span>{label}</span></NavLink>)}
  </nav><div className="sidebar-bottom">
    {can(PERMISSIONS.AUDIT) && <NavLink to="/audit" className="nav-item"><ClipboardCheck size={17}/><span>Audit Log</span></NavLink>}
    {can(PERMISSIONS.USERS) && <NavLink to="/settings/users" className="nav-item"><Users size={17}/><span>Users</span></NavLink>}
    {can(PERMISSIONS.ORG) && <NavLink to="/settings/organization" className="nav-item"><Settings size={17}/><span>Settings</span></NavLink>}
  </div></aside>;
}
