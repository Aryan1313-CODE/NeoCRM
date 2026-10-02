import type { Organization, OrganizationInput } from './types';
let record:Organization={name:'NeoCRM Industries',industry:'Chemical Manufacturing',website:'https://example.com',contactEmail:'contact@example.com',phone:'+91 00000 00000',address:'Business district, Mumbai, India',members:24,activeUsers:21,created:'January 2026'};
/** Development-only in-memory organization fixture. Replace with documented API calls later. */
export async function getOrganization(){return {...record};}
export async function updateOrganization(input:OrganizationInput){record={...record,...input};return {...record};}
