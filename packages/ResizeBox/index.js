// 导入组件，组件必须声明 name
import ColdResizeBox from './src'

// 为组件提供 install 安装方法，供按需引入
ColdResizeBox.install = function (Vue) {
  Vue.component(ColdResizeBox.name, ColdResizeBox)
}

export default ColdResizeBox
