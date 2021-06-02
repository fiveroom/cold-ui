import Vue from 'vue'
import App from './App.vue'

import coldUi from 'cold-ui-vue';
import 'cold-ui-vue/lib/cold-ui.css';

import './assets/global.scss'

import ResizeBox from "../packages/ResizeBox";
import ResizePage from "../packages/ResizePage";


Vue.config.productionTip = false

Vue.use(coldUi);
Vue.use(ResizeBox);
Vue.use(ResizePage);

new Vue({
  render: h => h(App),
}).$mount('#app');


