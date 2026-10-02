export type Organization = { name:string; industry:string; website:string; contactEmail:string; phone:string; address:string; members:number; activeUsers:number; created:string };
export type OrganizationInput = Pick<Organization,'name'|'industry'|'website'|'contactEmail'|'phone'|'address'>;
