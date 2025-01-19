import { auth } from './firebase';
import { get } from 'svelte/store';
import { accessToken } from './stores/auth';

export async function getCalendarEvents(startDate?: Date, endDate?: Date) {
    try {
        const token = get(accessToken);
        if (!token) {
            throw new Error('No access token available');
        }

        // Calculating time range
        const timeMin = startDate ? startDate.toISOString() : new Date().toISOString();
        const timeMax = endDate ? endDate.toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
        url.searchParams.append('timeMin', timeMin);
        url.searchParams.append('timeMax', timeMax);
        url.searchParams.append('maxResults', '100');
        url.searchParams.append('singleEvents', 'true');
        url.searchParams.append('orderBy', 'startTime');

      
        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Calendar API Error:', errorData);
            throw new Error(errorData.error?.message || 'Failed to fetch calendar events');
        }

        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        throw error;
    }
} 