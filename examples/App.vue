<template>

    <div>
        <button @click="addBox">add</button>
        <button @click="box.lock = !box.lock">set Data</button>
        <div id="app">
            <co-re-page
                :boxArr="boxArr"
                id-prop-name="id"
                :tips-color="tipsColor"
                :use-stand="true"
                :rect-prop-rewrite="{
                    width: 'width',
                    height: 'height',
                    top: 'top',
                    left: 'left'
                }"
                :old-height="oldHeight"
                :old-width="oldWidth"
                :show-dis="openDisStu"
                :min-show-dis="minShowDis"
            >
                <CoReBox
                    :ref="`CoReBox${ind}`"
                    v-for="(i, ind) in boxArr"
                    :key="ind"
                    :tips-color="tipsColor"
                    :boxId="i.id"
                    :w.sync="i.width"
                    :h.sync="i.height"
                    :l.sync="i.left"
                    :t.sync="i.top"
                    :lock="i.lock"
                >
                </CoReBox>
            </co-re-page>
        </div>
        <div>
            工具框

            提示颜色 <input @change="changeColor" v-model="tipsColor" type="color" />

            间距提示 <input type="checkbox" v-model="openDisStu">

            最小间距 <input type="number" v-model="minShowDis">

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
            minShowDis: 10,
            openDisStu: false,
            dataT: {
                w: 100,
                h: 100,
                l: 0,
                t: 0,
            },
            tipsColor: '#000',
            oldHeight: 0,
            oldWidth: 0,
            box: {
                width: 100,
                height: 100,
                left: Math.random() * 700 ,
                top: Math.random() * 300 ,
                id: 'box',
                lock: false
            },
            chartData: {
                columns: ["日期", "访问用户", "下单用户", "下单率"],
                rows: [
                    { 日期: "1/1", 访问用户: 1393, 下单用户: 1093, 下单率: 0.32 },
                    { 日期: "1/2", 访问用户: 3530, 下单用户: 3230, 下单率: 0.26 },
                    { 日期: "1/3", 访问用户: 2923, 下单用户: 2623, 下单率: 0.76 },
                    { 日期: "1/4", 访问用户: 1723, 下单用户: 1423, 下单率: 0.49 },
                    { 日期: "1/5", 访问用户: 3792, 下单用户: 3492, 下单率: 0.323 },
                    { 日期: "1/6", 访问用户: 4593, 下单用户: 4293, 下单率: 0.78 }
                ]
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
        changeColor(event){
            console.log('e :>> ', event);
        },
        setD() {
            this.$refs.CoReBox.setDataM(+new Date())
        },
        change(newV, item){
            Object.entries(newV).forEach((i, j) => {
                item[i] = j;
            })
        }
    },
    created() {
        setTimeout(() => {
            this.boxArr = Array.from({length: 4}).map((i, ind) => ({
                width: 200,
                height: 200,
                left: Math.round(Math.random() * 700 ),
                top: Math.round(Math.random() * 300) ,
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
    height: 70vh;
    width: 90%;
    border: 1px solid red;
    position: relative;
    min-height: 400px;
    z-index: 0;
}
</style>
