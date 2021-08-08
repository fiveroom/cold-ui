<template>
    <div>
        <button @click="addBox">add</button>
        <button @click="box.lock = !box.lock">set Data</button>
        <div class="drag">
            <ul>
                <li class="drag-box" @mousemove.prevent @mousedown="checkBox($event)">drag1</li>
                <li class="drag-box" @mousemove.prevent @mousedown="checkBox($event)">drag2</li>
                <li class="drag-box" @mousemove.prevent @mousedown="checkBox($event)">drag3</li>
                <li class="drag-box" @mousemove.prevent @mousedown="checkBox($event)">drag4</li>
            </ul>
        </div>
        <div id="app">
<!--            <co-re-page-->
<!--                ref="coRePage"-->
<!--                :boxArr="boxArr"-->
<!--                id-prop-name="id"-->
<!--                :tips-color="tipsColor"-->
<!--                :use-stand="true"-->
<!--                :rect-prop-rewrite="{-->
<!--                    width: 'width',-->
<!--                    height: 'height',-->
<!--                    top: 'top',-->
<!--                    left: 'left'-->
<!--                }"-->
<!--                :old-height="oldHeight"-->
<!--                :old-width="oldWidth"-->
<!--                :show-dis="openDisStu"-->
<!--                :min-show-dis="minShowDis"-->
<!--            >-->
<!--                <CoReBox-->
<!--                    :ref="`CoReBox${ind}`"-->
<!--                    v-for="(i, ind) in boxArr"-->
<!--                    :key="ind"-->
<!--                    :tips-color="tipsColor"-->
<!--                    :boxId="i.id"-->
<!--                    :w.sync="i.width"-->
<!--                    :h.sync="i.height"-->
<!--                    :l.sync="i.left"-->
<!--                    :t.sync="i.top"-->
<!--                    :lock="false"-->
<!--                >-->
<!--                </CoReBox>-->
<!--            </co-re-page>-->
        </div>
        <div class="drag-show" :style="{'outline-color': tipsColor}" ref="dragShow">

        </div>
        <div>
            工具框

            提示颜色 <input @change="changeColor" v-model="tipsColor" type="color"/>

            间距提示 <input type="checkbox" v-model="openDisStu">

            最小间距 <input type="number" v-model="minShowDis">

        </div>
        <CoReBox
            v-bind.sync="dataTR"
            :source-ele="'body'"
            v-if="openTest"
            :au-to-parent-size="true"
            move-selector=".app-move"
            :trickList="['cm']"
        >
            <header class="app-move">jajaja </header>
        </CoReBox>
        <button @click="openTest = !openTest">打开</button>
    </div>
</template>

<script>
import HelloWorld from "./components/HelloWorld";
import {s4, uId} from "../packages";

// import 'cold-ui/lib/cold-ui.css'
import {coRePage, coReBox} from "../packages";
import {debounce, throttle} from "lodash";

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
            openTest: false,
            boxArr: [],
            minShowDis: 10,
            openDisStu: false,
            dataT: {
                w: 100,
                h: 100,
                l: 0,
                t: 0,
            },
            dataTR: {
                w: 100,
                h: 100,
                l: 0,
                t: 0,
            },

            coRePageInfo: null,
            tipsColor: '#000',
            oldHeight: 0,
            oldWidth: 0,
            boxCheckStu: false,
            box: {
                width: 100,
                height: 100,
                left: Math.random() * 700,
                top: Math.random() * 300,
                id: 'box',
                lock: false
            },
            addId: null,
            chartData: {
                columns: ["日期", "访问用户", "下单用户", "下单率"],
                rows: [
                    {日期: "1/1", 访问用户: 1393, 下单用户: 1093, 下单率: 0.32},
                    {日期: "1/2", 访问用户: 3530, 下单用户: 3230, 下单率: 0.26},
                    {日期: "1/3", 访问用户: 2923, 下单用户: 2623, 下单率: 0.76},
                    {日期: "1/4", 访问用户: 1723, 下单用户: 1423, 下单率: 0.49},
                    {日期: "1/5", 访问用户: 3792, 下单用户: 3492, 下单率: 0.323},
                    {日期: "1/6", 访问用户: 4593, 下单用户: 4293, 下单率: 0.78}
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
        changeColor(event) {
            console.log('e :>> ', event);
        },
        setD() {
            this.$refs.CoReBox.setDataM(+new Date())
        },
        change(newV, item) {
            Object.entries(newV).forEach((i, j) => {
                item[i] = j;
            })
        },

        checkBox(event) {
            this.boxCheckStu = true;
            this.$refs.dragShow.style.display = 'block';
            this.$refs.dragShow.style.transform = `translate(${event.pageX - 100}px, ${event.pageY - 100}px)`;
        },
        setActiveDe: debounce( function (source){
            console.log('source :>> ', source.ids);
            this.$refs.coRePage.$el.focus();
            this.$refs.coRePage.getActiveBox(source.ids);
        }, 500)
    },

    created() {
        setTimeout(() => {
            this.boxArr = Array.from({length: 2}).map((i, ind) => ({
                width: 200,
                height: 200,
                left: Math.round(Math.random() * 1000),
                top: Math.round(Math.random() * 300),
                id: 'box' + ind,
                lock: false
            }));
            this.oldWidth = 1400;
            this.oldHeight = 600;
        }, 2000)
    },
    mounted() {
        // document.documentElement.addEventListener('mousemove', (event) => {
        //     if (this.boxCheckStu) {
        //         let leftBox = event.pageX - 100;
        //         let topBox = event.pageY - 100;
        //         if (leftBox >= this.coRePageInfo.left
        //             && topBox >= this.coRePageInfo.top
        //             && topBox + 200 <= this.coRePageInfo.bottom
        //             && leftBox + 200 <= this.coRePageInfo.right
        //         ) {
        //             if (!this.addId) {
        //                 this.addId = 'newBox_' + s4();
        //                 let len = this.boxArr.push({
        //                     width: 200,
        //                     height: 200,
        //                     left: leftBox - this.coRePageInfo.left,
        //                     top: topBox - this.coRePageInfo.top,
        //                     id: this.addId,
        //                     lock: false
        //                 });
        //                 this.$refs.dragShow.style.display = 'none';
        //                 this.$nextTick(() =>{
        //                     const source = this.$refs[`CoReBox${len - 1}`][0];
        //                     source.mouseDownEvent({
        //                         target: {
        //                             dataset: {
        //                                 movetype: 'move'
        //                             }
        //                         },
        //                         pageX: event.pageX,
        //                         pageY: event.pageY,
        //                         button: 0
        //                     });
        //                     this.setActiveDe(source)
        //                 })
        //                 // setTimeout(() => {
        //                 //     this.$refs[`CoReBox${len - 1}`][0].mouseDownEvent({
        //                 //         target: {
        //                 //             dataset: {
        //                 //                 movetype: 'move'
        //                 //             }
        //                 //         },
        //                 //         pageX: event.pageX ,
        //                 //         pageY: event.pageY ,
        //                 //         button: 0
        //                 //     });
        //                 // }, 100)
        //             }
        //         } else {
        //             if (this.boxArr[this.boxArr.length - 1].id === this.addId) {
        //                 this.boxArr.pop();
        //                 this.addId = null;
        //             }
        //             this.$refs.dragShow.style.display = 'block';
        //             this.$refs.dragShow.style.transform = `translate(${event.pageX - 100}px, ${event.pageY - 100}px)`;
        //         }
        //         event.preventDefault();
        //     }
        // })

        // document.documentElement.addEventListener('mouseup', (event) => {
        //     if (this.boxCheckStu) {
        //         this.boxCheckStu = false;
        //         this.$refs.dragShow.style.display = 'none';
        //         this.addId = null;
        //     }
        // })
        // this.coRePageInfo = this.$refs.coRePage.$el.getBoundingClientRect();
        // console.log('this.coRePageInfo :>> ', this.coRePageInfo);

    }

}
</script>

<style lang="scss">
#app {
    height: 70vh;
    top: 40px;
    left: 400px;
    right: 10px;
    border: 1px solid red;
    position: absolute;
    min-height: 400px;
    z-index: 0;
    overflow: hidden;
}
body,html{
    height: 100%;
    width: 100%;
    margin: 0;
}
.drag {
    width: 300px;
    height: 72vh;
    background-color: #007fd4;
    padding: 10px;
    box-sizing: border-box;
    overflow: auto;

    * {
        padding: 0;
        margin: 0;
    }

    li {
        cursor: grab;
        list-style-type: none;

        & + li {
            margin-top: 10px;
        }

        width: 100%;
        height: 250px;
        background-color: antiquewhite;

        &:active {
            cursor: grabbing;
        }
    }
}

.drag-show {
    cursor: grabbing;
    width: 200px;
    height: 200px;
    position: absolute;
    background-color: transparent;
    outline-style: dashed ;
    outline-width: 1px;
    top: 0;
    left: 0;
    display: none;
    will-change: transform;
    transform-origin: left top;
}

.app-move{
    background-color: #007fd4;
}
</style>
