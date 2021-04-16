import Vue from 'vue';
import Vuex from 'vuex';
import VuexPersistence from 'vuex-persist';

const vuexLocal = new VuexPersistence({
    storage: window.localStorage
});

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        device: null,
        isMobileLayout: false,
        isSmallMobileLayout: false,
    },
    mutations: {
        setDevice(state, device) {
            state.device = device;
        }
    },
    plugins: [vuexLocal.plugin]
});
