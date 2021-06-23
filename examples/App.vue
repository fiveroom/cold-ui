<template>

    <div>
        <button @click="addBox">add</button>
        <button @click="box.lock = !box.lock">set Data</button>
        <div id="app">
            <co-re-page
                :boxArr="boxArr"
                id-prop-name="id"
                :use-stand="true"
                :rect-prop-rewrite="{
                    width: 'width',
                    height: 'height',
                    top: 'top',
                    left: 'left'
                }"
                :old-height="oldHeight"
                :old-width="oldWidth"
            >
                <CoReBox
                    :ref="`CoReBox${ind}`"
                    v-for="(i, ind) in boxArr"
                    :key="ind"
                    :boxId="i.id"
                    :w.sync="i.width"
                    :h.sync="i.height"
                    :l.sync="i.left"
                    :t.sync="i.top"
                    :lock="i.lock"
                ></CoReBox>
            </co-re-page>
        </div>
    </div>
</template>

<script>
import HelloWorld from "./components/HelloWorld";
import {uId} from "../packages";

// import 'cold-ui/lib/cold-ui.css'
import {coRePage, coReBox} from "../packages";
// import { coReBox, coRePage } from "cold-ui";

export default {
    name: 'App',
    components: {
        HelloWorld,
        CoReBox: coReBox,
        CoRePage: coRePage
    },
    data() {
        return {
            boxArr: [],
            dataT: {
                w: 100,
                h: 100,
                l: 0,
                t: 0,
            },
            oldHeight: 0,
            oldWidth: 0,
            box: {
                width: 100,
                height: 100,
                left: Math.random() * 700 ,
                top: Math.random() * 300 ,
                id: 'box',
                lock: false
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
        setTimeout(() => {
            this.boxArr = Array.from({length: 2}).map((i, ind) => ({
                width: 100,
                height: 100,
                left: Math.random() * 700 ,
                top: Math.random() * 300 ,
                id: 'box' + ind,
                lock: false
            }));
            this.oldWidth = 1400;
            this.oldHeight =  600;
        }, 2000)
    },
    mounted(){


    }

}
</script>

<style lang="scss">
#app {
    height: 600px;
    width: 90%;
    border: 1px solid red;
    position: relative;
    min-height: 400px;
    z-index: 0;
}
</style>
