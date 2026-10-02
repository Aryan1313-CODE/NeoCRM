import type { ManagedUser, UserInput } from './types';
let rows: ManagedUser[] = [
 {id:'usr-01',name:'Aarav Sharma',email:'aarav@example.com',role:'Administrator',status:'Active',lastActive:'Just now'},
 {id:'usr-02',name:'Priya Mehta',email:'priya@example.com',role:'Manager',status:'Active',lastActive:'Today, 9:42 AM'},
 {id:'usr-03',name:'Rahul Verma',email:'rahul@example.com',role:'Sales',status:'Inactive',lastActive:'Sep 24, 2026'},
 {id:'usr-04',name:'Nisha Kapoor',email:'nisha@example.com',role:'Viewer',status:'Active',lastActive:'Yesterday'},
];
/** Development-only in-memory data source. Replace with documented API calls when available. */
export async function listUsers(){return [...rows];}
export async function createUser(input:UserInput){const user:ManagedUser={...input,id:`usr-${Date.now()}`,lastActive:'Never'};rows=[user,...rows];return user;}
export async function updateUser(id:string,input:UserInput){const updated=rows.find(user=>user.id===id);if(!updated)throw new Error('User not found');Object.assign(updated,input);return {...updated};}
export async function setUserStatus(id:string,status:'Active'|'Inactive'){const updated=rows.find(user=>user.id===id);if(!updated)throw new Error('User not found');updated.status=status;return {...updated};}
