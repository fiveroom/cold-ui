<template>
    <div class="group-box">
        group-box
<!--        <div class="group-box-item" v-for="child in children">-->
<!--            <component-->
<!--                :is="child.name"-->
<!--            >-->
<!--            </component>-->
<!--        </div>-->
    </div>
</template>

<script>
import Test from "./test.vue";
import TestChild from "./test-child.vue";

export default {
    name: "group",
    props: {
        children: {
            type: Array,
            default: () => []
        },
    },
    components: {
        'test-one-box': Test,
        'test-two-box': TestChild
    },
}
</script>

<style scoped lang="scss">
.group-box {
    width: 100%;
    height: 100%;
    position: relative;

    &-item {

    }
}
</style>
