import { writable } from 'svelte/store';
import type { User } from 'firebase/auth';

const browser = typeof window !== 'undefined';

export const user = writable<User | null>(null);
export const isLoading = writable(true);
export const accessToken = writable<string | null>(browser ? localStorage.getItem('calendar_access_token') : null); 