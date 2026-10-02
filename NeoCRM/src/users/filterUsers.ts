import type { ManagedUser, UserRole, UserStatus } from './types';
export function filterUsers(users:readonly ManagedUser[],query:string,status:UserStatus|'All',role:UserRole|'All'){
 const normalized=query.trim().toLowerCase();
 return users.filter(user=>(!normalized||user.name.toLowerCase().includes(normalized)||user.email.toLowerCase().includes(normalized))&&(status==='All'||user.status===status)&&(role==='All'||user.role===role));
}
