import { NavLink } from 'react-router-dom';
import { navigation, settingsNav, type NavigationItem } from './nav';
import { useAppStore } from '../../store/appStore';
import { classNames } from '../../lib/utils';
import { usePermissions } from '../../permissions/PermissionProvider';
export function Sidebar() {
 const { sidebarOpen, setSidebarOpen } = useAppStore();
 const { hasPermission } = usePermissions();
 const link = (item: NavigationItem) => <NavLink key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={({ isActive }) => classNames('nav-link', isActive && 'active')}><span className="nav-icon" aria-hidden="true">{item.icon}</span>{item.label}</NavLink>;
 return <><div className={classNames('sidebar-scrim', sidebarOpen && 'visible')} onClick={() => setSidebarOpen(false)} /><aside className={classNames('sidebar', sidebarOpen && 'sidebar-open')}><NavLink className="brand" to="/dashboard"><span className="brand-mark">N</span><span>Neo<span className="brand-light">CRM</span></span><span className="brand-caption">CHEMICAL INDUSTRY</span></NavLink><div className="workspace-switch"><span className="workspace-icon">C</span><span><strong>Chemora Group</strong><small>Enterprise workspace</small></span><span className="chevron">⌄</span></div><nav className="sidebar-nav" aria-label="Main navigation">{navigation.map(section => { const visibleItems = section.items.filter(item => hasPermission(item.permission)); return visibleItems.length ? <div className="nav-section" key={section.label}><p className="nav-heading">{section.label}</p>{visibleItems.map(link)}</div> : null; })}</nav><div className="sidebar-bottom">{hasPermission(settingsNav.permission) && link(settingsNav)}<div className="sidebar-footnote"><span className="status-dot"/>All systems operational</div></div></aside></>;
}
