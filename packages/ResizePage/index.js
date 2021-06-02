// 导入组件，组件必须声明 name
import CoRePage from './src'

// 为组件提供 install 安装方法，供按需引入
CoRePage.install = function (Vue) {
    Vue.component(CoRePage.name, CoRePage)
}

export default CoRePage
