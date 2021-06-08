// 导入组件，组件必须声明 name
import CoReBox from './src'


// 为组件提供 install 安装方法，供按需引入
CoReBox.install = function (Vue) {
  Vue.component(CoReBox.name, CoReBox)
}

export default CoReBox
