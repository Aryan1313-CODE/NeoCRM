import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
export function AppShell() { return <div className="app-shell"><Sidebar/><main className="main-area"><Topbar/><div className="content-area"><Outlet/></div></main></div>; }
