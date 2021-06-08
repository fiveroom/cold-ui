<template>
    <div class="co-re_page-home" tabindex="0"
         @keydown.stop.prevent="boxKeyDown($event)"
         @keyup.stop.prevent="boxKeyUp($event)"
    >
        <slot></slot>
        <div
            class="co-re_page-stand co-re_page-stand-x"
            style="opacity: 0"
            ref="standX"
        ></div>
        <div
            class="co-re_page-stand co-re_page-stand-y"
            style="opacity: 0"
            ref="standY"
        ></div>
    </div>
</template>

<script>
import ResizeBox from "../../ResizeBox/src";
import {numToFixed} from "../../tools";
import {throttle, debounce} from "lodash";

export default {
    name: "CoRePage",
    props: {
        boxArr: {
            type: Array,
            default: () => ([])
        },
        useStand: {
            type: Boolean,
            default: false
        },
        useBlockStand: {
            type: Boolean,
            default: false
        },
        idPropName: String,
        rectPropRewrite: {
            type: Object,
            default: () => ({
                width: 'w',
                height: 'h',
                top: 't',
                left: 'l'
            })
        },
        useKeyControl: {
            type: Boolean,
            default: true
        },
        keyStep: {
            type: Number,
            default: 1
        },
        oldWidth: {
            type: Number,
            default: 0,
        },
        oldHeight: {
            type: Number,
            default: 0,
        }
    },
    data() {
        return {
            xStand: {
                top: 0,
                display: false,
            },
            yStand: {
                left: 0,
                display: false,
            },
            alignDis: 4,
            box: {
                width: 0,
                height: 0,
                centerW: 0,
                centerH: 0,
                xV: 0,
                yV: 0
            },
            oldBox: {
                width: 0,
                height: 0
            },
            leftChange: 'no',
            topChange: 'no',
            compIds: {},
            boxArrObj: {},
            rectProp: {
                width: 'w',
                height: 'h',
                top: 't',
                left: 'l'
            },
            keyDownEvent: {
                ArrowRight: [true, false],
                39: [true, false],
                ArrowLeft: [false, false],
                37: [false, false],
                ArrowDown: [true, true],
                40: [true, true],
                ArrowUp: [false, true],
                38: [false, true]
            },
            checkBoxes: new Set(),
            keyDownData: null,
            controlStu: false,
            setParentSizeToBoxDe: null,
            resizeBoxDe: debounce(this.resizeBox, 30)
        }
    },
    watch: {
        boxArr() {
            this.initResizeBox()
        }
    },
    mounted() {
        this.initBoxSize();
        this.initResizeBox()
        this.bindDocEvent()
    },
    beforeDestroy() {
        this.clearDocEvent()
    },
    created() {
        this.oldBox.width = this.oldWidth;
        this.oldBox.height = this.oldHeight;
        Object.assign(this.rectProp, this.rectPropRewrite);
        this.setParentSizeToBoxDe = debounce(this.setParentSizeToBox, 500);
    },
    components: {
        ResizeBox
    },
    methods: {
        initBoxSize() {
            let rect = this.$el.getBoundingClientRect();
            this.box.height = rect.height;
            this.box.width = rect.width;
            this.box.centerW = rect.width / 2;
            this.box.centerH = rect.height / 2;
            this.box.xV = rect.left + window.scrollX;
            this.box.yV = rect.top + window.scrollY;
        },
        initResizeBox() {
            this.boxArrObj = {};
            if (this.idPropName) {
                this.boxArr.forEach(i => {
                    i[this.idPropName] && (this.boxArrObj[i[this.idPropName]] = i);
                })
            }
            this.$nextTick(() => {
                const slots = this.$slots.default;
                slots?.forEach(item => {
                    const comp = item.componentInstance;
                    if (comp && comp.$options.name === 'CoReBox') {
                        if (this.compIds[comp.compId]) return;
                        this.compIds[comp.compId] = comp;
                        if(this.useStand){
                            comp.$on('resizing', this.resizeEvent.bind(this));
                            comp.$on('resized', this.resizeStop.bind(this));
                        }
                        if(this.useKeyControl){
                            comp.$on('check-box', this.getActiveBox.bind(this));
                            comp.$on('uncheck-box', this.getUnActiveBox.bind(this));
                        }
                    }
                })
                this.setParentSizeToBox()
            })
        },
        getActiveBox({compId}){
            if(this.controlStu){
                let stu = this.checkBoxes.has(compId);
                if(this.checkBoxes.has(compId)){
                    this.checkBoxes.delete(compId);
                } else {
                    this.checkBoxes.add(compId);
                }
                this.checkBoxes[stu ? 'delete' : 'add'](compId);
                this.compIds[compId].setActive(!stu)
            } else {
                this.checkBoxes.forEach(i => {
                    this.compIds[i].setActive(false)
                })
                this.checkBoxes.add(compId);
                this.compIds[compId].setActive(true)
            }

        },
        getUnActiveBox({compId}){
            this.checkBoxes.delete(compId);
        },
        boxKeyDown(event){
            this.controlStu = event.ctrlKey;
            if(!this.checkBoxes.size) return;
            if(!this.keyDownData){
                this.keyDownData = {}
            }
            const done =this.keyDownEvent[event.code || event.keyCode];
            if(done){
                this.checkBoxes.forEach(val => {
                    this.keyDownData[val] =  this.compIds[val].actionMoveByStep.apply(null, this.setStepVal(done))
                });
                this.boxKeyDownEnd();
            }

        },
        boxKeyDownEnd: debounce(function(){
            Object.keys(this.keyDownData).forEach(val => {
                const source = this.keyDownData[val];
                let obj = this.boxArrObj[source.boxId];
                obj[this.rectProp.top] = source.top;
                obj[this.rectProp.left] = source.left;
            })
            this.keyDownData = null;
        }, 500),
        boxKeyUp(event){
            this.controlStu = event.ctrlKey;
            this.clearStand();
        },
        setStepVal([add, top]){
            return [add ? this.keyStep : -this.keyStep, top]
        },
        resizeStop({boxId}) {
            let obj = this.boxArrObj[boxId]
            if(obj){
                if(!this.useStand) return;
                if (this.topChange !== 'no') {
                    obj[this.rectProp.top] = this.topChange;
                }
                if (this.leftChange !== 'no') {
                    obj[this.rectProp.left] = this.leftChange;
                }
                this.clearStand()
            }
        },
        resizeEvent: throttle(function (resizingData) {
            this.pagePost(resizingData.rect);
            this.blockPost(resizingData.rect, resizingData.boxId);
            if (this.xStand.display) {
                this.$refs.standX.style.transform = `translateY(${this.xStand.top}px)`;
                this.$refs.standX.style.opacity = '1';
            } else {
                this.$refs.standX.style.opacity = '0';
            }
            if (this.yStand.display) {
                this.$refs.standY.style.transform = `translateX(${this.yStand.left}px)`;
                this.$refs.standY.style.opacity = '1';
            } else {
                this.$refs.standY.style.opacity = '0';
            }
        }, 80, {
            trailing: false
        }),
        clearStand(){
            this.$refs.standY.style.opacity = '0';
            this.$refs.standY.style.transform = 'translateY(0px)';
            this.$refs.standX.style.opacity = '0';
            this.$refs.standX.style.transform = 'translateX(0px)';
            this.yStand.display = false;
            this.xStand.display = false;
            this.leftChange = "no";
            this.topChange = "no";
        },
        pagePost(newRect) {
            let disW = newRect.w / 2 + newRect.l;
            let disH = newRect.h / 2 + newRect.t;
            if (
                Math.abs(disW - this.box.centerW) < this.alignDis &&
                Math.abs(disW - this.box.centerW) !== 0
            ) {
                this.leftChange = this.box.centerW - newRect.w / 2;
                this.yStand.left = this.box.centerW;
                this.yStand.display = true;
            } else if (
                Math.abs(newRect.l - this.box.centerW) < this.alignDis &&
                Math.abs(newRect.l - this.box.centerW) !== 0
            ) {
                this.leftChange = this.box.centerW;
                this.yStand.left = this.box.centerW;
                this.yStand.display = true;
            } else if (
                Math.abs(newRect.l + newRect.w - this.box.centerW) < this.alignDis &&
                Math.abs(newRect.l + newRect.w - this.box.centerW) !== 0
            ) {
                this.leftChange = this.box.centerW - newRect.w;
                this.yStand.left = this.box.centerW;
                this.yStand.display = true;
            } else {
                this.leftChange = "no";
                this.yStand.display = false;
            }
            if (
                Math.abs(disH - this.box.centerH) < this.alignDis &&
                Math.abs(disH - this.box.centerH) !== 0
            ) {
                this.xStand.top = this.box.centerH;
                this.topChange = this.box.centerH - newRect.h / 2;
                this.xStand.display = true;
            } else if (
                Math.abs(newRect.t - this.box.centerH) < this.alignDis &&
                Math.abs(newRect.t - this.box.centerH) !== 0
            ) {
                this.xStand.top = this.box.centerH;
                this.topChange = this.box.centerH;
                this.xStand.display = true;
            } else if (
                Math.abs(newRect.t + newRect.h - this.box.centerH) < this.alignDis &&
                Math.abs(newRect.t + newRect.h - this.box.centerH) !== 0
            ) {
                this.xStand.top = this.box.centerH;
                this.topChange = this.box.centerH - newRect.h;
                this.xStand.display = true;
            } else {
                this.xStand.display = false;
                this.topChange = "no";
            }

        },
        blockPost(newRect, moduleId) {
            if (this.boxArr.length < 1) return;
            let resTopArr = [];
            let resLeftArr = [];
            let resBotmArr = [];
            let resRightArr = [];
            let resLevArr = [];
            let resVerArr = [];
            let restBArr = [];
            let resbTArr = [];
            let resrLArr = [];
            let reslRArr = [];
            this.boxArr.forEach((it) => {
                if(it[this.idPropName] === moduleId) return;
                resTopArr.push({
                    dis: Math.abs(it.t - newRect.t),
                    obj: it,
                });
                resLeftArr.push({
                    dis: Math.abs(it.l - newRect.l),
                    obj: it,
                });
                resRightArr.push({
                    dis: Math.abs(
                        it.l + it.w - newRect.l - newRect.w
                    ),
                    obj: it,
                });
                resBotmArr.push({
                    dis: Math.abs(
                        it.t + it.h - newRect.t - newRect.h
                    ),
                    obj: it,
                });
                resLevArr.push({
                    dis: Math.abs(
                        it.l +
                        it.w / 2 -
                        newRect.l -
                        newRect.w / 2
                    ),
                    obj: it,
                });
                resVerArr.push({
                    dis: Math.abs(
                        it.t +
                        it.h / 2 -
                        newRect.t -
                        newRect.h / 2
                    ),
                    obj: it,
                });
                restBArr.push({
                    dis: Math.abs(it.t + it.h - newRect.t),
                    obj: it,
                });
                resbTArr.push({
                    dis: Math.abs(it.t - newRect.t - newRect.h),
                    obj: it,
                });
                resrLArr.push({
                    dis: Math.abs(it.l - newRect.l - newRect.w),
                    obj: it,
                });
                reslRArr.push({
                    dis: Math.abs(it.l + it.w - newRect.l),
                    obj: it,
                });
            });
            // 边对齐
            // left right
            if (this.leftChange === "no") {
                let leftObjEle = this.findMin(resLeftArr);
                let leftObjCenEle = this.findMin(resLevArr); //水平
                let rightObjEle = this.findMin(resRightArr);
                let rLEle = this.findMin(resrLArr);
                let lREle = this.findMin(reslRArr);

                let leftCenDis =
                    leftObjCenEle &&
                    Math.abs(
                        newRect.l +
                        newRect.w / 2 -
                        leftObjCenEle.l -
                        leftObjCenEle.w / 2
                    );
                let leftDis =
                    leftObjEle && Math.abs(leftObjEle.l - newRect.l);
                let rightDis =
                    rightObjEle &&
                    Math.abs(
                        rightObjEle.l +
                        rightObjEle.w -
                        newRect.l -
                        newRect.w
                    );
                let rLEleDis =
                    rLEle &&
                    Math.abs(rLEle.l - newRect.l - newRect.w);
                let lREleDis =
                    lREle && Math.abs(lREle.l + lREle.w - newRect.l);
                if (leftObjCenEle && leftCenDis < this.alignDis && leftCenDis !== 0) {
                    this.yStand.left =
                        leftObjCenEle.l + leftObjCenEle.w / 2 ;
                    this.leftChange =
                        leftObjCenEle.l +
                        leftObjCenEle.w / 2 -
                        newRect.w / 2;
                    this.yStand.display = true;
                } else if (leftObjEle && leftDis < this.alignDis && leftDis !== 0) {
                    this.leftChange = leftObjEle.l;
                    this.yStand.left = this.leftChange;
                    this.yStand.display = true;
                } else if (rLEle && rLEleDis < this.alignDis && rLEleDis !== 0) {
                    this.leftChange = rLEle.l - newRect.w;
                    this.yStand.left = rLEle.l ;
                    this.yStand.display = true;
                } else if (lREle && lREleDis < this.alignDis && lREleDis !== 0) {
                    this.leftChange = lREle.l + lREle.w;
                    this.yStand.left = this.leftChange;
                    this.yStand.display = true;
                } else if (rightObjEle && rightDis < this.alignDis && rightDis !== 0) {
                    this.leftChange =
                        rightObjEle.l + rightObjEle.w - newRect.w;
                    this.yStand.left =
                        rightObjEle.l + rightObjEle.w;
                    this.yStand.display = true;
                } else {
                    this.leftChange = "no";
                    this.yStand.display = false;
                }
            }
            // t bottom
            if (this.topChange === "no") {
                let topObjEle = this.findMin(resTopArr);
                let topObjCenEle = this.findMin(resVerArr); //垂直
                let bottomObjCenEle = this.findMin(resBotmArr);
                let tbEle = this.findMin(restBArr);
                let bTEle = this.findMin(resbTArr);
                let topCenDis =
                    topObjCenEle &&
                    Math.abs(
                        newRect.t +
                        newRect.h / 2 -
                        topObjCenEle.t -
                        topObjCenEle.h / 2
                    );
                let topDis = topObjEle && Math.abs(topObjEle.t - newRect.t);
                let bottomDis =
                    bottomObjCenEle &&
                    Math.abs(
                        bottomObjCenEle.t +
                        bottomObjCenEle.h -
                        newRect.t -
                        newRect.h
                    );
                let tbEleDis =
                    tbEle && Math.abs(tbEle.t + tbEle.h - newRect.t);
                let bTEleDis =
                    bTEle && Math.abs(bTEle.t - newRect.t - newRect.h);
                if (topObjCenEle && topCenDis < this.alignDis && topCenDis !== 0) {
                    this.xStand.top =
                        topObjCenEle.t + topObjCenEle.h / 2;
                    this.topChange =
                        topObjCenEle.t +
                        topObjCenEle.h / 2 -
                        newRect.h / 2;
                    this.xStand.display = true;
                } else if (tbEle && tbEleDis < this.alignDis && tbEleDis !== 0) {
                    this.topChange = tbEle.t + tbEle.h;
                    this.xStand.top = this.topChange;
                    this.xStand.display = true;
                } else if (topObjEle && topDis < this.alignDis && topDis !== 0) {
                    this.topChange = topObjEle.t;
                    this.xStand.top = this.topChange;
                    this.xStand.display = true;
                } else if (bTEle && bTEleDis < this.alignDis && bTEleDis !== 0) {
                    this.topChange = bTEle.t - newRect.h;
                    this.xStand.top = bTEle.t;
                    this.xStand.display = true;
                } else if (
                    bottomObjCenEle &&
                    bottomDis < this.alignDis &&
                    bottomDis !== 0
                ) {
                    this.topChange =
                        bottomObjCenEle.t +
                        bottomObjCenEle.h -
                        newRect.h;
                    this.xStand.top =
                        bottomObjCenEle.t + bottomObjCenEle.h ;
                    this.xStand.display = true;
                } else {
                    this.topChange = 'no';
                    this.xStand.display = false;
                }
            }
        },
        findMin(arr) {
            arr.sort((a, b) => a.dis - b.dis);
            return (arr[0] && arr[0].obj) || null;
        },
        clearCheck(){
            this.checkBoxes.clear();
            this.checkBoxes.forEach(i => {
                this.compIds[i].setActive(false)
            })
        },
        bindDocEvent(){
            document.addEventListener('mousedown', this.clearCheck);
            window.addEventListener('resize', this.resizeBoxDe);
            window.addEventListener('resize', this.setParentSizeToBoxDe);
        },
        clearDocEvent(){
            document.removeEventListener('mousedown', this.clearCheck);
            window.removeEventListener('resize', this.resizeBoxDe);
            window.removeEventListener('resize', this.setParentSizeToBoxDe);

        },
        setParentSizeToBox(){
            Object.keys(this.compIds).forEach(i => {
                this.compIds[i].setParentSize(this.box);
            })
        },
        resizeBox(){
            if(!this.oldBox.width) {
                this.oldBox.width = this.box.width;
                this.oldBox.height = this.box.height;
            }
            this.initBoxSize()
            let ratioW = this.oldBox.width / this.box.width;
            let ratioH = this.oldBox.height / this.box.height;
            this.boxArr.forEach(item => {
                if (ratioW !== 1) {
                    item.w = numToFixed(item.w / ratioW);
                    item.l = numToFixed(item.l / ratioW);
                }
                if (ratioH !== 1) {
                    item.h = numToFixed(item.h / ratioH);
                    item.t = numToFixed(item.t / ratioH);
                }
            })
            this.oldBox.width = this.box.width;
            this.oldBox.height = this.box.height;
        },
    },
}
</script>

<style scoped lang="scss">
@import "../../global.scss";

$name: 're_page';

.#{$prefix}-#{$name}-home {
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 0;
    &:focus{
        outline: none;
    }
}

.#{$prefix}-#{$name}-stand {
    position: absolute;
    z-index: 9999;
    transform-origin: 0 0;
    top: 0;
    left: 0;
    display: block;

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
