<template>
    <div class="co-re_page-home">
        <slot></slot>
        <div
            class="co-re_page-stand co-re_page-stand-x"
        ></div>
        <div
            class="co-re_page-stand co-re_page-stand-y"
        ></div>
    </div>
</template>

<script>
import ResizeBox from "../../ResizeBox/src";

export default {
    name: "CoRePage",
    props: {

    },
    mounted() {
        console.log(' :>> ', this.$slots);
    },
    comments: {
        ResizeBox
    },
    // render(h, context) {
    //
    //     return (
    //         <div class="co-re_page-home">
    //             <div
    //                 class="co-re_page-stand co-re_page-stand-x"
    //             ></div>
    //             <div
    //                 class="co-re_page-stand co-re_page-stand-y"
    //             ></div>
    //         </div>
    //     )
    // }
}
</script>

<style scoped lang="scss">
@import "../../global.scss";
$name: 're_page';

.#{$prefix}-#{$name}-home{
    width: 100%;
    height: 100%;
}

.#{$prefix}-#{$name}-stand {
    position: absolute;
    z-index: 99;
    transform-origin: 0 0;
    &-x {
        height: 0;
        width: 100%;
        border-top: 1px dashed #6eb1eb;
    }
    &-y {
        height: 100%;
        width: 0;
        border-right: 1px dashed #6eb1eb;
    }
}
</style>
