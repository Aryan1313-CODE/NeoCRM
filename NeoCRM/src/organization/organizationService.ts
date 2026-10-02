import type { Organization, OrganizationInput } from './types';
export class OrganizationServiceUnavailableError extends Error { constructor(){super('Organization settings are not connected to the backend yet.');this.name='OrganizationServiceUnavailableError';} }
export async function getOrganization():Promise<Organization>{if(import.meta.env.DEV){const mock=await import('./mockOrganizationAdapter');return mock.getOrganization();}throw new OrganizationServiceUnavailableError();}
export async function updateOrganization(input:OrganizationInput):Promise<Organization>{if(import.meta.env.DEV){const mock=await import('./mockOrganizationAdapter');return mock.updateOrganization(input);}throw new OrganizationServiceUnavailableError();}
