import React from "react";
import { Bell, ChevronDown, Search } from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
export function Topbar() {
  const { user, logout } = useAuth();
  return <header className="topbar"><div className="search-box"><Search size={16}/><input placeholder="Search customers, products, deals..."/></div>
    <div className="topbar-right"><button className="icon-btn" aria-label="Notifications"><Bell size={18}/></button><div className="profile">
      <div className="avatar">{user?.name?.slice(0,2).toUpperCase()}</div><div className="profile-copy"><strong>{user?.name}</strong><span>{user?.role?.replaceAll("_", " ")}</span></div>
      <button className="profile-menu" onClick={logout} aria-label="Sign out"><ChevronDown size={16}/></button>
    </div></div></header>;
}
