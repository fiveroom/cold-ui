<template>
    <div class="cd-resize-home">

    </div>
</template>

<script>
export default {
    name: "ResizeBox",
    props: {

    },
    data(){
        return {

        }
    }
}
</script>

<style scoped lang="scss">
@import "../../global.scss";
$name: 'resize';
.#{$prefix}-#{$name}-home{
    width: 50px;
    height: 50px;
    background-color: skyblue;
    transform: translate(0, 0);
}
</style>
