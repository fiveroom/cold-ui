import Vue from 'vue'
import App from './App.vue'

// import coldUi from 'cold-ui-vue';


import './assets/global.scss'
import Test from "./components/test";
import TestChild from "./components/test-child";


Vue.component('test', Test)
Vue.component('test-child', TestChild)
Vue.config.productionTip = false

// Vue.use(coldUi);

new Vue({
  render: h => h(App),
}).$mount('#app');


