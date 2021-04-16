import Vue from 'vue';
import MarqueeText from 'vue-marquee-text-component';
import App from './App.vue';
import vuetify from './assets/plugins/vuetify.js';

import store from './store.js';
import './filters.js';
import './mixins.js';

Vue.config.productionTip = false;

Vue.component('marquee-text', MarqueeText);

new Vue({
    store,
    vuetify,
    render: h => h(App)
}).$mount('#app')
