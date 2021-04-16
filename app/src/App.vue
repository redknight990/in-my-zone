<template>
    <v-app>
        <v-main>
            <MusicPlayer/>
        </v-main>
    </v-app>
</template>

<script>
    import { Plugins } from '@capacitor/core';
    import MusicPlayer from './components/MusicPlayer';

    const { Device } = Plugins;

    export default {
        name: 'App',
        components: {
            MusicPlayer,
        },
        async created() {
            this.$store.commit('setDevice', await Device.getInfo());
            this.$store.state.isMobileLayout = this.getLayoutWidth() <= 600;
            this.$store.state.isSmallMobileLayout = this.getLayoutWidth() <= 360;

            window.addEventListener('resize', async () => {
                this.$store.commit('setDevice', await Device.getInfo());
                this.$store.state.isMobileLayout = this.getLayoutWidth() <= 600;
                this.$store.state.isSmallMobileLayout = this.getLayoutWidth() <= 360;
            });
        }
    };
</script>
