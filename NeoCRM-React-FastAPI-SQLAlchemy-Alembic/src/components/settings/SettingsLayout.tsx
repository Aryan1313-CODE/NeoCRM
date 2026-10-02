import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { usePermissions } from "../../permissions/PermissionProvider";
import { PERMISSIONS } from "../../permissions/permissions";
export function SettingsLayout(){
  const {can}=usePermissions();
  return <div><div className="settings-nav"><div><strong>Settings</strong><span>Workspace administration</span></div><nav>
    {can(PERMISSIONS.USERS)&&<NavLink to="/settings/users">Users & Roles</NavLink>}
    {can(PERMISSIONS.ORG)&&<NavLink to="/settings/organization">Organization</NavLink>}
  </nav></div><Outlet/></div>;
}
