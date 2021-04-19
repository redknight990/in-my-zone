<template>
    <v-app>
        <v-main>
            <div class="w-100 h-100 d-flex flex-column justify-center">
                <v-container fluid :style="containerStyle">
                    <MusicPlayer/>
                </v-container>
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
        },
        computed: {
            containerStyle() {
                if (this.isMobileLayout)
                    return `padding: 0; height: 100%;`;
                return `max-width: 400px;`
            }
        }
    };
</script>

<style lang="scss">
    @import "./assets/style/global.scss";
</style>
