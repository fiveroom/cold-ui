// 导入button组件
import coReBox from "./coReBox";
import coRePage from "./coRePage";


// 组件列表
const components = [
    coReBox,
    coRePage
]

// 定义 install 方法，接收 Vue 作为参数。如果使用 use 注册插件，那么所有的组件都会被注册
/**
 *
 * @param Vue {Vue}
 */
const install = function (Vue) {
    // 遍历注册全局组件
    components.map(component => Vue.component(component.name, component))
}

// 判断是否是直接引入文件
if (typeof window !== 'undefined' && window.Vue) {
    install(window.Vue)
}

export default install

export { coReBox, coRePage }

export * from "./tools";
