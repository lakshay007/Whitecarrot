<!-- 
 * Main page component for the CarrotEvents application.
 * Handles authentication flow and renders either the login screen or calendar view.
 * Uses Firebase for authentication and manages access tokens for Google Calendar API. -->
 
<script lang="ts">
    import { auth, googleProvider } from '$lib/firebase';
    import { signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
    import { user, accessToken } from '$lib/stores/auth';
    import Calendar from '$lib/components/Calendar.svelte';
    import { fade, fly } from 'svelte/transition';

    // Prevents multiple login attempts while initial login is in progress
    let initialLoginInProgress = false;

    /**
     * Handles the Google Sign-In process.
     * Manages the OAuth flow and stores the access token for Calendar API access.
     * Shows appropriate error messages for common authentication issues.
     */
    async function handleLogin() {
        if (initialLoginInProgress) return;
        initialLoginInProgress = true;

        try {
            const result = await signInWithPopup(auth, googleProvider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            
            if (!credential?.accessToken) {
                throw new Error('Failed to get access token');
            }

            // Store token in both store and localStorage for persistence
            accessToken.set(credential.accessToken);
            localStorage.setItem('calendar_access_token', credential.accessToken);
            console.log('Sign-in successful with OAuth token');
        } catch (error: any) {
            console.error('Error signing in:', error);
            if (error.code === 'auth/popup-closed-by-user') {
                console.log('User closed the popup');
            }
            accessToken.set(null);
            localStorage.removeItem('calendar_access_token');
        } finally {
            initialLoginInProgress = false;
        }
    }

    /**
     * Handles user logout.
     * Cleans up authentication state and removes stored tokens.
     */
    async function handleLogout() {
        try {
            await signOut(auth);
            accessToken.set(null);
            localStorage.removeItem('calendar_access_token');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }
</script>

<!-- Main container with background and responsive padding -->
<div class="min-h-screen bg-gray-900 text-gray-100 p-2 sm:p-4 transition-all duration-300 relative overflow-hidden">
    <!-- Decorative background with carrot pattern -->
    <div class="carrot-bg"></div>
    
    <!-- Main content container with z-index to appear above background -->
    <div class="max-w-7xl mx-auto relative z-10">
        <!-- Header section with app title and auth controls -->
        <header class="bg-gray-800 shadow-lg rounded-lg p-4 mb-6">
            <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
                <!-- App logo and title -->
                <h1 class="text-2xl font-bold text-orange-400 flex items-center whitespace-nowrap">
                    <svg class="w-8 h-8 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="#FFA500"/>
                        <path d="M12 5V12L16 16" stroke="#4A5568" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    CarrotEvents
                </h1>

                <!-- Conditional rendering of auth buttons -->
                {#if $user}
                    <!-- User info and logout button for authenticated users -->
                    <div class="flex items-center gap-4 flex-wrap justify-center">
                        <span class="text-gray-300 text-sm sm:text-base break-all text-center sm:text-left">{$user.email}</span>
                        <button
                            on:click={handleLogout}
                            class="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors duration-200 w-full sm:w-auto"
                        >
                            Logout
                        </button>
                    </div>
                {:else}
                    <!-- Login button for unauthenticated users -->
                    <button
                        on:click={handleLogin}
                        class="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors duration-200 flex items-center gap-2 w-full sm:w-auto justify-center"
                        disabled={initialLoginInProgress}
                    >
                        <svg class="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1Z"
                            />
                        </svg>
                        {initialLoginInProgress ? 'Connecting...' : 'Login with Google'}
                    </button>
                {/if}
            </div>
        </header>

        <!-- Main content area with conditional rendering based on auth state -->
        {#if $user && $accessToken}
            <!-- Calendar view for authenticated users -->
            <main in:fade="{{ duration: 300 }}" class="bg-gray-800 shadow-lg rounded-lg p-3 sm:p-6">
                <Calendar />
            </main>
        {:else}
            <!-- Welcome screen for unauthenticated users -->
            <div in:fly="{{ y: 50, duration: 300 }}" class="bg-gray-800 shadow-lg rounded-lg p-4 sm:p-8">
                <div class="text-center mb-12">
                    <h2 class="text-xl sm:text-2xl font-semibold text-orange-400 mb-4">Welcome to CarrotEvents</h2>
                    <p class="text-gray-300 mb-6">Organize your time, harvest your productivity. Login to view your calendar.</p>
                    <button
                        on:click={handleLogin}
                        class="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors duration-200 inline-flex items-center gap-2 transform hover:scale-105 w-full sm:w-auto justify-center"
                        disabled={initialLoginInProgress}
                    >
                        <svg class="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1Z"
                            />
                        </svg>
                        {initialLoginInProgress ? 'Planting Seeds...' : 'Login with Google'}
                    </button>
                </div>

                <!-- Feature showcase grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
                    <!-- Feature cards with descriptions and visual examples -->
                    <!-- Feature 1: Event Display -->
                    <div class="bg-gray-900 p-6 rounded-lg shadow-md">
                        <div class="text-orange-400 mb-4">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 class="text-lg font-semibold text-orange-400 mb-2">Smart Event Display</h3>
                        <p class="text-gray-400">View your events in a clean, organized table with essential details like title, time, location, and type.</p>
                        <div class="mt-4 bg-gray-800 p-3 rounded">
                            <div class="flex items-center gap-2 text-sm text-gray-300 mb-2">
                                <span class="w-20">Title:</span>
                                <span class="text-gray-400">Team Meeting</span>
                            </div>
                            <div class="flex items-center gap-2 text-sm text-gray-300">
                                <span class="w-20">Location:</span>
                                <span class="text-gray-400">Conference Room A</span>
                            </div>
                        </div>
                    </div>

                    <!-- Feature 2: Smart Filters -->
                    <div class="bg-gray-900 p-6 rounded-lg shadow-md">
                        <div class="text-orange-400 mb-4">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        </div>
                        <h3 class="text-lg font-semibold text-orange-400 mb-2">Smart Filters</h3>
                        <p class="text-gray-400">Filter events by date range, type, or search across titles and descriptions.</p>
                        <div class="mt-4 space-y-3">
                            <div class="bg-gray-800 p-2 rounded flex items-center gap-2">
                                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <span class="text-sm text-gray-400">Search events...</span>
                            </div>
                            <div class="bg-gray-800 p-2 rounded text-sm text-gray-400">
                                Event Type ▾
                            </div>
                        </div>
                    </div>

                    <!-- Feature 3: Export Options -->
                    <div class="bg-gray-900 p-6 rounded-lg shadow-md">
                        <div class="text-orange-400 mb-4">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 class="text-lg font-semibold text-orange-400 mb-2">Export & Share</h3>
                        <p class="text-gray-400">Export your events to CSV or PDF format for easy sharing and offline access.</p>
                        <div class="mt-4 flex gap-3">
                            <div class="bg-green-600/20 text-green-400 px-3 py-1.5 rounded text-sm flex items-center gap-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                CSV
                            </div>
                            <div class="bg-orange-600/20 text-orange-400 px-3 py-1.5 rounded text-sm flex items-center gap-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                PDF
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    /* Global styles for consistent dark theme */
    :global(body) {
        background-color: #1a202c;
        color: #e2e8f0;
    }

    /* Common button styles */
    button {
        font-weight: 600;
        letter-spacing: 0.025em;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    /* Enhanced shadow for card elements */
    .shadow-lg {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }

    /* Decorative background pattern */
    .carrot-bg {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cpath d='M30 0L15 30 30 60 45 30z' fill='%23FFA500' fill-opacity='0.05'/%3E%3C/svg%3E");
        opacity: 0.1;
        z-index: 0;
    }
</style>
