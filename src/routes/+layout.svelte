<script lang="ts">
    import '../app.css';
    import { onMount } from 'svelte';
    import { auth } from '$lib/firebase';
    import { user, isLoading } from '$lib/stores/auth';
    import { onAuthStateChanged } from 'firebase/auth';

    onMount(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            user.set(currentUser);
            isLoading.set(false);
        });

        return () => unsubscribe();
    });
</script>

<slot /> 