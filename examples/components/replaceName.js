const COMPONENT_NAME_LINK = {
    'one': 'test-one-box',
    'two': 'test-two-box',
    'group': 'group-box'
}

export default {
    methods: {
        /**
         * 替换盒子名称为组件名称
         * @param name {string} 盒子名称
         * @returns {string} 对应组件名称
         */
        replaceName(name) {
            return COMPONENT_NAME_LINK[name]
        }
    },
}
