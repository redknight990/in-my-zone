<template>
    <v-app>
        <v-main>
            <MusicPlayer/>
        </v-main>
    </v-app>
</template>

<script>
    import MusicPlayer from './components/MusicPlayer.vue';

    export default {
        name: 'App',
        components: {
            MusicPlayer,
        }
    };
</script>
