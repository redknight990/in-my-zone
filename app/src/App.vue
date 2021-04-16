<template>
    <v-app>
        <v-main>
            <div class="w-100 h-100 d-flex flex-column justify-center">
                <v-container fluid style="max-width: 400px;" v-if="!isMobileLayout">
                    <MusicPlayer/>
                </v-container>
                <MusicPlayer v-else/>
            </div>
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

<style lang="scss">
    @import "./assets/style/global.scss";
</style>
