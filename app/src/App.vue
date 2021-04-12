<template>
    <v-app>
        <v-main>
            <HelloWorld/>
        </v-main>
    </v-app>
</template>

<script>
    import HelloWorld from './components/MusicPlayer.vue';

    export default {
        name: 'App',
        components: {
            HelloWorld,
        }
    };
</script>
