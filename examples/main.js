import Vue from 'vue'
import App from './App.vue'

// import coldUi from 'cold-ui-vue';


import './assets/global.scss'


Vue.config.productionTip = false

// Vue.use(coldUi);

new Vue({
  render: h => h(App),
}).$mount('#app');


