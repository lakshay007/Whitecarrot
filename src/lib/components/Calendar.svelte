<script lang="ts">
    import { onMount } from 'svelte';
    import { getCalendarEvents } from '$lib/calendar';
    import type { calendar_v3 } from '@googleapis/calendar/build/v3';
    import { format } from 'date-fns';
    import { fade, fly } from 'svelte/transition';

    let events: calendar_v3.Schema$Event[] = [];
    let filteredEvents: calendar_v3.Schema$Event[] = [];
    let loading = false;
    let error: string | null = null;
    let startDate: string = format(new Date(), 'yyyy-MM-dd');
    let endDate: string = format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
    let searchQuery = '';
    let selectedType = 'all';
    let selectedEvent: calendar_v3.Schema$Event | null = null;
    let showModal = false;

    // Event types for filtering
    const eventTypes = [
        { value: 'all', label: 'All Events' },
        { value: 'default', label: 'Default' },
        { value: 'fromGmail', label: 'From Gmail' },
        { value: 'birthday', label: 'Birthday' },
        { value: 'workingLocation', label: 'Working Location' }
    ];

    function setToday() {
        const today = new Date();
        startDate = format(today, 'yyyy-MM-dd');
        endDate = format(today, 'yyyy-MM-dd');
    }

    function filterEvents() {
        filteredEvents = events.filter(event => {
            const matchesSearch = searchQuery.trim() === '' || 
                event.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.location?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesType = selectedType === 'all' || 
                (event.eventType === selectedType) || 
                (!event.eventType && selectedType === 'default');

            return matchesSearch && matchesType;
        });
    }

    function exportToCSV() {
        const headers = ['Title', 'Start', 'End', 'Location', 'Type', 'Description'];
        const csvData = filteredEvents.map(event => [
            event.summary || 'Untitled Event',
            event.start?.dateTime ? format(new Date(event.start.dateTime), 'PPp') : 
                event.start?.date ? format(new Date(event.start.date), 'PP') : 'N/A',
            event.end?.dateTime ? format(new Date(event.end.dateTime), 'PPp') : 
                event.end?.date ? format(new Date(event.end.date), 'PP') : 'N/A',
            event.location || 'No location',
            event.eventType || 'Default',
            event.description || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `calendar_events_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function exportToPDF() {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <html>
                <head>
                    <title>Calendar Events</title>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                        th { background-color: #f8f9fa; }
                        h1 { color: #333; }
                    </style>
                </head>
                <body>
                    <h1>Calendar Events (${format(new Date(startDate), 'PP')} - ${format(new Date(endDate), 'PP')})</h1>
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Start</th>
                                <th>End</th>
                                <th>Location</th>
                                <th>Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredEvents.map(event => `
                                <tr>
                                    <td>${event.summary || 'Untitled Event'}</td>
                                    <td>${event.start?.dateTime ? format(new Date(event.start.dateTime), 'PPp') : 
                                        event.start?.date ? format(new Date(event.start.date), 'PP') : 'N/A'}</td>
                                    <td>${event.end?.dateTime ? format(new Date(event.end.dateTime), 'PPp') : 
                                        event.end?.date ? format(new Date(event.end.date), 'PP') : 'N/A'}</td>
                                    <td>${event.location || 'No location'}</td>
                                    <td>${event.eventType || 'Default'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    }

    function openEventDetails(event: calendar_v3.Schema$Event) {
        selectedEvent = event;
        showModal = true;
    }

    function closeModal() {
        showModal = false;
        selectedEvent = null;
    }

    $: {
        if (searchQuery !== undefined || selectedType) {
            filterEvents();
        }
    }

    $: {
        if (startDate || endDate) {
            loadEvents();
        }
    }

    async function loadEvents() {
        loading = true;
        error = null;
        try {
            events = await getCalendarEvents(
                startDate ? new Date(startDate) : undefined,
                endDate ? new Date(endDate) : undefined
            );
            filterEvents();
        } catch (e) {
            error = e instanceof Error ? e.message : 'Failed to load events';
        } finally {
            loading = false;
        }
    }

    onMount(loadEvents);
</script>

<div class="space-y-6">
    <div class="flex flex-col gap-4">
        <!-- Date filters and export buttons -->
        <div class="flex flex-wrap gap-4 items-center justify-between">
            <div class="flex flex-wrap gap-4 items-center">
                <div class="flex items-center gap-2">
                    <label for="start-date" class="text-sm font-medium text-gray-300">Start Date:</label>
                    <input
                        id="start-date"
                        type="date"
                        bind:value={startDate}
                        class="rounded bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 transition-colors duration-200"
                    />
                </div>
                <div class="flex items-center gap-2">
                    <label for="end-date" class="text-sm font-medium text-gray-300">End Date:</label>
                    <input
                        id="end-date"
                        type="date"
                        bind:value={endDate}
                        class="rounded bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 transition-colors duration-200"
                    />
                </div>
                <button
                    on:click={setToday}
                    class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors duration-200 shadow-md"
                >
                    Today
                </button>
            </div>
            
            <div class="flex gap-2">
                <button
                    on:click={exportToCSV}
                    class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors duration-200 shadow-md flex items-center gap-2"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    CSV
                </button>
                <button
                    on:click={exportToPDF}
                    class="bg-orange-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors duration-200 shadow-md flex items-center gap-2"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF
                </button>
            </div>
        </div>

        <!-- Search and type filter -->
        <div class="flex flex-wrap gap-4 items-center">
            <div class="flex-1 min-w-[200px]">
                <div class="relative">
                    <input
                        type="text"
                        placeholder="Search events..."
                        bind:value={searchQuery}
                        class="w-full rounded bg-gray-700 border-gray-600 text-gray-100 pl-10 pr-4 py-2 focus:border-orange-500 focus:ring-orange-500 transition-colors duration-200"
                    />
                    <svg 
                        class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            stroke-linecap="round" 
                            stroke-linejoin="round" 
                            stroke-width="2" 
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>
            </div>
            <select
                bind:value={selectedType}
                class="rounded bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 transition-colors duration-200"
            >
                {#each eventTypes as type}
                    <option value={type.value}>{type.label}</option>
                {/each}
            </select>
        </div>
    </div>

    {#if loading}
        <div class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
        </div>
    {:else if error}
        <div class="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded shadow-md">
            {error}
        </div>
    {:else if filteredEvents.length === 0}
        <div class="text-center py-8 text-gray-400">
            {searchQuery || selectedType !== 'all' ? 'No events found matching your filters.' : 'No events found for the selected date range.'}
        </div>
    {:else}
        <div class="overflow-x-auto rounded-lg shadow-md">
            <table class="min-w-full divide-y divide-gray-700">
                <thead class="bg-gray-800">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Title
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Start
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            End
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Location
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Type
                        </th>
                    </tr>
                </thead>
                <tbody class="bg-gray-900 divide-y divide-gray-800">
                    {#each filteredEvents as event}
                        <tr 
                            class="hover:bg-gray-800 transition-colors duration-150 cursor-pointer" 
                            on:click={() => openEventDetails(event)}
                        >
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm font-medium text-gray-100">
                                    {event.summary || 'Untitled Event'}
                                </div>
                                {#if event.description}
                                    <div class="text-xs text-gray-400 truncate max-w-xs">
                                        {event.description}
                                    </div>
                                {/if}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm text-gray-400">
                                    {event.start?.dateTime
                                        ? format(new Date(event.start.dateTime), 'PPp')
                                        : event.start?.date
                                        ? format(new Date(event.start.date), 'PP')
                                        : 'N/A'}
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm text-gray-400">
                                    {event.end?.dateTime
                                        ? format(new Date(event.end.dateTime), 'PPp')
                                        : event.end?.date
                                        ? format(new Date(event.end.date), 'PP')
                                        : 'N/A'}
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm text-gray-400">
                                    {#if event.location}
                                        <div class="flex items-center gap-2">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {event.location}
                                        </div>
                                    {:else}
                                        <span class="text-gray-500">No location</span>
                                    {/if}
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm text-gray-400">
                                    {event.eventType || 'Default'}
                                </div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}

    {#if showModal && selectedEvent}
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" on:click={closeModal} transition:fade>
            <div 
                class="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-auto overflow-hidden max-h-[90vh] flex flex-col" 
                on:click|stopPropagation
                transition:fly="{{ y: 50, duration: 300 }}"
            >
                <div class="p-6 flex flex-col flex-1 overflow-hidden">
                    <div class="flex justify-between items-start mb-4 flex-shrink-0">
                        <h3 class="text-xl font-semibold text-orange-400 pr-8">
                            {selectedEvent.summary || 'Untitled Event'}
                        </h3>
                        <button 
                            on:click={closeModal}
                            class="text-gray-400 hover:text-gray-300 transition-colors"
                        >
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div class="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                        <!-- Date and Time -->
                        <div class="flex items-start gap-3 flex-shrink-0">
                            <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div class="text-gray-300">
                                <div>
                                    {selectedEvent.start?.dateTime 
                                        ? format(new Date(selectedEvent.start.dateTime), 'PPP')
                                        : selectedEvent.start?.date
                                        ? format(new Date(selectedEvent.start.date), 'PPP')
                                        : 'No date'}
                                </div>
                                {#if selectedEvent.start?.dateTime}
                                    <div class="text-sm text-gray-400">
                                        {format(new Date(selectedEvent.start.dateTime), 'p')} - 
                                        {selectedEvent.end?.dateTime 
                                            ? format(new Date(selectedEvent.end.dateTime), 'p')
                                            : 'No end time'}
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <!-- Location -->
                        {#if selectedEvent.location}
                            <div class="flex items-start gap-3 flex-shrink-0">
                                <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <div class="text-gray-300">{selectedEvent.location}</div>
                            </div>
                        {/if}

                        <!-- Event Type -->
                        <div class="flex items-start gap-3 flex-shrink-0">
                            <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <div class="text-gray-300">{selectedEvent.eventType || 'Default'}</div>
                        </div>

                        <!-- Description -->
                        {#if selectedEvent.description}
                            <div class="flex items-start gap-3">
                                <svg class="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
                                </svg>
                                <div class="text-gray-300 whitespace-pre-wrap overflow-y-auto max-h-[40vh] custom-scrollbar">
                                    {selectedEvent.description}
                                </div>
                            </div>
                        {/if}

                        <!-- Meeting Link -->
                        {#if selectedEvent.hangoutLink}
                            <div class="flex items-start gap-3 flex-shrink-0">
                                <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <a 
                                    href={selectedEvent.hangoutLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    class="text-orange-400 hover:text-orange-300 transition-colors"
                                >
                                    Join Meeting
                                </a>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    input[type="date"]::-webkit-calendar-picker-indicator {
        filter: invert(1);
    }

    select {
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
        background-position: right 0.5rem center;
        background-repeat: no-repeat;
        background-size: 1.5em 1.5em;
        padding-right: 2.5rem;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        appearance: none;
    }

    .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #4B5563 transparent;
    }

    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #4B5563;
        border-radius: 3px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: #6B7280;
    }
</style>

