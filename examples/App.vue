<template>

    <div>
        <button @click="addBox">add</button>
        <button @click="setD">set Data</button>
        <div id="app">
            <co-re-page :boxArr="boxArr" id-prop-name="id" :use-stand="true">
                <CoReBox
                    :ref="`CoReBox${ind}`"
                    v-for="(i, ind) in boxArr"
                    :key="ind"
                    :boxId="i.id"
                    :w.sync="i.w"
                    :h.sync="i.h"
                    :l.sync="i.l"
                    :t.sync="i.t"
                ></CoReBox>
            </co-re-page>
        </div>
    </div>
</template>

<script>
import HelloWorld from "./components/HelloWorld";
import {uId} from "../packages/tools";

export default {
    name: 'App',
    components: {
        HelloWorld
    },
    data() {
        return {
            boxArr: [],
            dataT: {
                w: 100,
                h: 100,
                l: 0,
                t: 0,
            }
        }
    },
    methods: {
        addBox() {
            this.boxArr.push({
                    w: 100,
                    h: 100,
                    l: 0,
                    t: 0,
                    id: uId()
                }
            )
        },
        setD() {
            this.$refs.CoReBox.setDataM(+new Date())
        },
        change(newV, item){
            Object.entries(newV).forEach((i, j) => {
                item[i] = j;
            })
            console.log('object :>> ', newV);
        }
    },
    created() {
        this.boxArr = Array.from({length: 50}).map((i, ind) => ({
                    w: 100,
                    h: 100,
                    l: 0,
                    t: 0,
                    id: ind + 'box'
        }))
    },
    mounted(){


    }

}
</script>

<style lang="scss">
#app {
    height: 60vh;
    width: 90%;
    border: 1px solid red;
    position: relative;
    z-index: 0;
}
</style>
