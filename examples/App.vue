<template>

<div>
    <button @click="addBox">add</button>
    <button @click="setD">set Data</button>
<HelloWorld></HelloWorld>
    <div id="app">
<!--  <CoReBox ref="CoReBox"  v-bind.sync="dataT"></CoReBox> -->

<!--        <co-re-page :boxArr="boxArr" >-->
<!--            <CoReBox v-for="(i, ind) in boxArr" :key="ind" :boxId="ind" v-bind.sync="i"></CoReBox>-->
<!--        </co-re-page>-->

        <!--        <ResizeBox style="background-color: red"></ResizeBox>-->

    </div>
</div>
</template>

<script>
import HelloWorld from "./components/HelloWorld";

export default {
    name: 'App',
    components: {
        HelloWorld
    },
    data(){
        return {
            boxArr: [],
            dataT: {       width: 100,
                height: 100,
                left: 0,
                top: 0}
        }
    },
    methods:{
        addBox(){
            this.boxArr.push({
                width: 100,
                height: 100,
                left: 0,
                top: 0}
            )
        },
        setD(){
            this.$refs.CoReBox.setDataM(+new Date())
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
