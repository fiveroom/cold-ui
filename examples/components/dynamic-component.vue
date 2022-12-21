<template>
    <div class="dynamic-component">
        <component
            :is="componentName"
        ></component>
    </div>
</template>

<script>
import Test from "./test.vue";
import TestChild from "./test-child.vue";
import Group from "./group.vue";
import ReplaceName from "./replaceName";

export default {
    name: "dynamic-component",
    props: {
        obj: {
            type: Object,
            default: () => ({name: ''})
        },
    },
    components: {
        'test-one-box': Test,
        'test-two-box': TestChild,
        'group-box': Group
    },
    data() {
        return {
            componentName: ''
        }
    },
    created() {
        this.componentName = this.replaceName(this.obj.name);
        console.log(this.componentName);
    },
    mixins: [ReplaceName],
}
</script>

<style scoped>
.dynamic-component {
    width: 100%;
    height: 100%;
}
</style>
