import Vue from 'vue';

Vue.mixin({
    methods: {
        getLayoutWidth() {
            return window.outerWidth === 0 ? window.innerWidth : window.outerWidth;
        }
    },
    computed: {
        isIOS() {
            return this.device?.operatingSystem.toLowerCase() === 'ios';
        },
        isAndroid() {
            return this.device?.operatingSystem.toLowerCase() === 'android';
        },
        isDesktop() {
            return this.device?.platform === 'web';
        },
        isMobileLayout() {
            return this.$store.state.isMobileLayout;
        },
        device() {
            return this.$store.state.device;
        }
    }
});
