<template>
    <div id="app">
        <CoRePage>
            123
            <CoReBox v-for="i in boxArr" v-bind.sync="i"></CoReBox>
        </CoRePage>

        <!--        <ResizeBox style="background-color: red"></ResizeBox>-->

    </div>
</template>

<script>

export default {
    name: 'App',
    components: {
    },
    data(){
        return {
            boxArr: []
        }
    },
    created() {
        this.boxArr = Array.from({length: 1}).map(() => ({       width: 100,
            height: 100,
            left: 0,
            top: 0}))
    }
}
</script>

<style lang="scss">
#app{
    height: 600px;
    width: 400px;
    margin: 100px auto;
    border: 1px solid red;
    position: relative;
    z-index: 0;
}
</style>
