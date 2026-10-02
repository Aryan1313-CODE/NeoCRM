import type { ManagedUser, UserInput } from './types';
export class UserServiceUnavailableError extends Error { constructor(){super('User management is not connected to the backend yet.');this.name='UserServiceUnavailableError';} }
export async function listUsers():Promise<ManagedUser[]>{if(import.meta.env.DEV){const mock=await import('./mockUserAdapter');return mock.listUsers();}throw new UserServiceUnavailableError();}
export async function createUser(input:UserInput):Promise<ManagedUser>{if(import.meta.env.DEV){const mock=await import('./mockUserAdapter');return mock.createUser(input);}throw new UserServiceUnavailableError();}
export async function updateUser(id:string,input:UserInput):Promise<ManagedUser>{if(import.meta.env.DEV){const mock=await import('./mockUserAdapter');return mock.updateUser(id,input);}throw new UserServiceUnavailableError();}
export async function setUserStatus(id:string,status:'Active'|'Inactive'):Promise<ManagedUser>{if(import.meta.env.DEV){const mock=await import('./mockUserAdapter');return mock.setUserStatus(id,status);}throw new UserServiceUnavailableError();}
