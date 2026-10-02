import { useLocation, useNavigate } from 'react-router-dom';
import { Input } from '../ui/Input';
import { useAppStore } from '../../store/appStore';
import { useAuth } from '../../auth/AuthProvider';
import { navigation, settingsNav } from './nav';
export function Topbar() {
 const {setSidebarOpen,notifications}=useAppStore();const {user,signOut}=useAuth();const location=useLocation();const navigate=useNavigate();
 const page=location.pathname==='/settings/users'?'Users':location.pathname==='/settings/organization'?'Organization':[...navigation.flatMap(s=>s.items),settingsNav].find(i=>i.path===location.pathname)?.label??'Dashboard';
 async function handleSignOut(){await signOut();navigate('/login',{replace:true});}
 const initials=(user?.name??'User').split(/\s+/).map(part=>part[0]).slice(0,2).join('').toUpperCase();
 return <header className="topbar"><button className="icon-button menu-trigger" onClick={()=>setSidebarOpen(true)} aria-label="Open navigation">☰</button><div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-sep">/</span><strong>{page}</strong></div><div className="topbar-tools"><label className="search-box"><span aria-hidden="true">⌕</span><Input placeholder="Search anything..." aria-label="Search"/><kbd>⌘ K</kbd></label><button className="icon-button notification-button" aria-label={`${notifications} notifications`}><span>♧</span><i/></button><div className="topbar-divider"/><div className="profile-area"><div className="profile-identity"><span className="avatar" aria-hidden="true">{initials}</span><span className="profile-copy"><strong>{user?.name??'Signed-in user'}</strong><small>{user?.title??user?.email??'Account'}</small></span></div><button className="logout-button" onClick={handleSignOut} aria-label="Sign out">Sign out</button></div></div></header>;
}

