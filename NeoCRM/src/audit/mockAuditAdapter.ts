import type { AuditLog } from './types';
const now = Date.now(); const ago = (minutes: number) => new Date(now - minutes * 60000).toISOString();
const events: AuditLog[] = [
 {id:'a-1',timestamp:ago(18),userId:'u-1',userName:'Aarav Sharma',action:'Created',resource:'Customer',resourceId:'CUS-2048',description:'Created customer “Acme Chemicals”',status:'success'},
 {id:'a-2',timestamp:ago(85),userId:'u-2',userName:'Priya Mehta',action:'Updated',resource:'Quote',resourceId:'Q-1042',description:'Updated quote Q-1042',status:'success'},
 {id:'a-3',timestamp:ago(140),userId:'u-3',userName:'Rahul Verma',action:'Login',resource:'Authentication',description:'Successful login',status:'success'},
 {id:'a-4',timestamp:ago(280),userId:'u-2',userName:'Priya Mehta',action:'Updated',resource:'Organization',resourceId:'ORG-01',description:'Updated organization contact details',status:'success'},
 {id:'a-5',timestamp:ago(440),userId:'u-4',userName:'Maya Iyer',action:'Created',resource:'Deal',resourceId:'DEAL-318',description:'Created deal “Eastern plant expansion”',status:'success'},
 {id:'a-6',timestamp:ago(900),userId:'u-3',userName:'Rahul Verma',action:'Logout',resource:'Authentication',description:'Signed out of the workspace',status:'success'},
 {id:'a-7',timestamp:ago(1500),userId:'unknown',userName:'Unknown user',action:'Login',resource:'Authentication',description:'Unsuccessful sign-in attempt',status:'failed'},
 {id:'a-8',timestamp:ago(4320),userId:'u-1',userName:'Aarav Sharma',action:'Deleted',resource:'Lead',resourceId:'LEAD-089',description:'Deleted lead “Northstar Labs”',status:'success'},
];
/** Temporary frontend fixture. Replace when an audit API contract is available. */
export async function getAuditLogs(): Promise<AuditLog[]> { await new Promise(resolve => setTimeout(resolve, 300)); return events.map(event => ({...event})); }
