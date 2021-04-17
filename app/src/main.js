import Vue from 'vue';
import App from './App.vue';
import vuetify from './assets/plugins/vuetify.js';

import store from './store.js';
import './filters.js';
import './mixins.js';

Vue.config.productionTip = false;

new Vue({
    store,
    vuetify,
    render: h => h(App)
}).$mount('#app')
