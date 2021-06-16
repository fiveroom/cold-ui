<template>
    <div class="co-re_page-home"
         tabindex="0"
         @keydown="boxKeyDown($event)"
         @keyup="boxKeyUp($event)"
    >
        <div class="co-re_page-body">
            <slot></slot>
        </div>
        <div
            class="co-re_page-stand co-re_page-stand-x"
            ref="standX"
        ></div>
        <div
            class="co-re_page-stand co-re_page-stand-y"
            ref="standY"
        ></div>
        <object height="100%" width="100%" style="pointer-events: none" type="text/html" ref="objectHtml"></object>
        <canvas class=""></canvas>
    </div>
</template>

<script>
import {numToFixed} from "../../tools";
import {throttle, debounce} from "lodash";

export default {
    name: "coRePage",
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
        },
        autoFirstResize: {
            default: true,
            type: Boolean
        }
    },
    data() {
        return {
            xStand: {
                top: 0,
                value: 'no'
            },
            yStand: {
                left: 0,
                value: 'no'
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
            setParentSizeToBoxDe: debounce(this.setParentSizeToBox, 500),
            resizeBoxDe: debounce(this.resizeBox, 30),
            boxArrBack: null,
        }
    },
    watch: {
        boxArr: {
            immediate: true,
            handler() {
                this.initResizeBox()
            }
        },
        oldHeight() {
            if(this.oldHeight !== this.oldBox.height){
                this.oldBox.height = this.oldHeight;
                this.autoFirstResize && this.resizeBoxDe();
            }
        },
        oldWidth() {
            if(this.oldWidth !== this.oldBox.width){
                this.oldBox.width = this.oldWidth;
                this.autoFirstResize && this.resizeBoxDe();
            }
        }
    },
    mounted() {
        this.initBoxSize()
        this.bindDocEvent();
    },
    beforeDestroy() {
        this.clearDocEvent()
    },
    created() {
        Object.assign(this.rectProp, this.rectPropRewrite);
    },

    methods: {
        initBoxSize() {
            let rect = this.$el.getBoundingClientRect();
            this.box.height = this.$el.clientHeight;
            this.box.width = this.$el.clientWidth;
            this.box.centerW = this.box.width / 2;
            this.box.centerH = this.box.height / 2;
            this.box.xV = rect.left + window.scrollX + this.$el.clientLeft;
            this.box.yV = rect.top + window.scrollY + this.$el.clientTop;
        },
        initResizeBox() {
            this.boxArrObj = {};
            if (this.idPropName) {
                this.boxArrBack = this.boxArr.map(i => {
                    let proxyObj = this.proxyRect(i);
                    i[this.idPropName] && (this.boxArrObj[i[this.idPropName]] = proxyObj);
                    return proxyObj
                })
            }
            this.$nextTick(() => {
                const slots = this.$slots.default;
                slots?.forEach(item => {
                    const comp = item.componentInstance;
                    if (comp && comp.$options.name === 'coReBox') {
                        if (this.compIds[comp.compId]) return;
                        this.compIds[comp.compId] = comp;
                        if (this.useStand) {
                            comp.$on('resizing', this.resizeEvent.bind(this));
                            comp.$on('resized', this.resizeStop.bind(this));
                        }
                        if (this.useKeyControl) {
                            comp.$on('check-box', this.getActiveBox.bind(this));
                            comp.$on('uncheck-box', this.getUnActiveBox.bind(this));
                        }
                    }
                })
                this.setParentSizeToBox()
            })
        },
        getActiveBox({compId}) {
            if (this.controlStu) {
                let stu = this.checkBoxes.has(compId);
                if (this.checkBoxes.has(compId)) {
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
        getUnActiveBox({compId}) {
            this.checkBoxes.delete(compId);
        },
        boxKeyDown(event) {
            this.controlStu = event.ctrlKey;
            if (!this.checkBoxes.size) return;
            if (!this.keyDownData) {
                this.keyDownData = {}
            }
            const done = this.keyDownEvent[event.code || event.keyCode];
            if (done) {
                event.stopPropagation();
                event.preventDefault();
                this.checkBoxes.forEach(val => {
                    this.keyDownData[val] = this.compIds[val].actionMoveByStep.apply(null, this.setStepVal(done))
                });
                this.boxKeyDownEnd();
            }

        },
        boxKeyDownEnd: debounce(function () {
            Object.keys(this.keyDownData).forEach(val => {
                const source = this.keyDownData[val];
                let obj = this.boxArrObj[source.boxId];
                if (obj) {
                    obj.t = source.top;
                    obj.l = source.left;
                }
            })
            this.keyDownData = null;
        }, 500),
        boxKeyUp(event) {
            this.controlStu = event.ctrlKey;
            this.clearStand();
        },
        setStepVal([add, top]) {
            return [add ? this.keyStep : -this.keyStep, top]
        },
        resizeStop({boxId}) {
            let obj = this.boxArrObj[boxId];
            this.$nextTick(() => {
                if(this.xStand.value !== 'no'){
                    obj.t = numToFixed(this.xStand.value);
                }
                if(this.yStand.value !== 'no'){
                    obj.l = numToFixed(this.yStand.value);
                }
                this.clearStand()
                this.emitOldSize();
            })
        },
        emitOldSize(){
            this.$emit('update:oldWidth', this.box.width);
            this.$emit('update:oldHeight', this.box.height);
        },
        resizeEvent: throttle(function (resizingData) {
            this.pagePost(resizingData.rect);
            this.blockPost(resizingData.rect, resizingData.boxId);
            if (this.xStand.value !== 'no') {
                this.$refs.standX.style.transform = `translateY(${this.xStand.top}px)`;
                this.$refs.standX.style.opacity = '1';
            } else {
                this.$refs.standX.style.opacity = '0';
            }
            if (this.yStand.value !== 'no') {
                this.$refs.standY.style.transform = `translateX(${this.yStand.left}px)`;
                this.$refs.standY.style.opacity = '1';
            } else {
                this.$refs.standY.style.opacity = '0';
            }
        }, 50, {
            trailing: false
        }),
        clearStand() {
            this.$refs.standY.style.opacity = '0';
            this.$refs.standY.style.transform = 'translateY(0px)';
            this.$refs.standX.style.opacity = '0';
            this.$refs.standX.style.transform = 'translateX(0px)';
            this.yStand.value = "no";
            this.xStand.value = "no";
        },
        pagePost(newRect) {
            let disW = newRect.w / 2 + newRect.l;
            let disH = newRect.h / 2 + newRect.t;
            if (
                Math.abs(disW - this.box.centerW) < this.alignDis &&
                Math.abs(disW - this.box.centerW) !== 0
            ) {
                this.yStand.value = this.box.centerW - newRect.w / 2;
                this.yStand.left = this.box.centerW;
            } else if (
                Math.abs(newRect.l - this.box.centerW) < this.alignDis &&
                Math.abs(newRect.l - this.box.centerW) !== 0
            ) {
                this.yStand.value = this.box.centerW;
                this.yStand.left = this.box.centerW;
            } else if (
                Math.abs(newRect.l + newRect.w - this.box.centerW) < this.alignDis &&
                Math.abs(newRect.l + newRect.w - this.box.centerW) !== 0
            ) {
                this.yStand.value = this.box.centerW - newRect.w;
                this.yStand.left = this.box.centerW;
            } else {
                this.yStand.value = "no";
            }
            if (
                Math.abs(disH - this.box.centerH) < this.alignDis &&
                Math.abs(disH - this.box.centerH) !== 0
            ) {
                this.xStand.top = this.box.centerH;
                this.xStand.value = this.box.centerH - newRect.h / 2;
            } else if (
                Math.abs(newRect.t - this.box.centerH) < this.alignDis &&
                Math.abs(newRect.t - this.box.centerH) !== 0
            ) {
                this.xStand.top = this.box.centerH;
                this.xStand.value = this.box.centerH;
            } else if (
                Math.abs(newRect.t + newRect.h - this.box.centerH) < this.alignDis &&
                Math.abs(newRect.t + newRect.h - this.box.centerH) !== 0
            ) {
                this.xStand.top = this.box.centerH;
                this.xStand.value = this.box.centerH - newRect.h;
            } else {
                this.xStand.value = "no";
            }

        },
        blockPost(newRect, moduleId) {
            if (this.boxArrBack.length < 1) return;
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
            this.boxArrBack.forEach((it) => {
                if (it[this.idPropName] === moduleId) return;
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
            if (this.yStand.value === "no") {
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
                        leftObjCenEle.l + leftObjCenEle.w / 2;
                    this.yStand.value =
                        leftObjCenEle.l +
                        leftObjCenEle.w / 2 -
                        newRect.w / 2;
                } else if (leftObjEle && leftDis < this.alignDis && leftDis !== 0) {
                    this.yStand.value = leftObjEle.l;
                    this.yStand.left = this.yStand.value;
                } else if (rLEle && rLEleDis < this.alignDis && rLEleDis !== 0) {
                    this.yStand.value = rLEle.l - newRect.w;
                    this.yStand.left = rLEle.l;
                } else if (lREle && lREleDis < this.alignDis && lREleDis !== 0) {
                    this.yStand.value = lREle.l + lREle.w;
                    this.yStand.left = this.yStand.value;
                } else if (rightObjEle && rightDis < this.alignDis && rightDis !== 0) {
                    this.yStand.value =
                        rightObjEle.l + rightObjEle.w - newRect.w;
                    this.yStand.left =
                        rightObjEle.l + rightObjEle.w;
                } else {
                    this.yStand.value = "no";
                }
            }
            // t bottom
            if (this.xStand.value === "no") {
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
                    this.xStand.value =
                        topObjCenEle.t +
                        topObjCenEle.h / 2 -
                        newRect.h / 2;
                } else if (tbEle && tbEleDis < this.alignDis && tbEleDis !== 0) {
                    this.xStand.value = tbEle.t + tbEle.h;
                    this.xStand.top = this.xStand.value;
                } else if (topObjEle && topDis < this.alignDis && topDis !== 0) {
                    this.xStand.value = topObjEle.t;
                    this.xStand.top = this.xStand.value;
                } else if (bTEle && bTEleDis < this.alignDis && bTEleDis !== 0) {
                    this.xStand.value = bTEle.t - newRect.h;
                    this.xStand.top = bTEle.t;
                } else if (
                    bottomObjCenEle &&
                    bottomDis < this.alignDis &&
                    bottomDis !== 0
                ) {
                    this.xStand.value =
                        bottomObjCenEle.t +
                        bottomObjCenEle.h -
                        newRect.h;
                    this.xStand.top =
                        bottomObjCenEle.t + bottomObjCenEle.h;
                } else {
                    this.xStand.value = 'no';
                }
            }
        },
        proxyRect(target) {
            if (!target) return
            let v = this;
            return new Proxy(target, {
                get(tar, p) {
                    switch (p) {
                        case 'l':
                            return tar[v.rectPropRewrite.left || 'l']
                        case 't':
                            return tar[v.rectPropRewrite.top || 't']
                        case 'w':
                            return tar[v.rectPropRewrite.width || 'w']
                        case 'h':
                            return tar[v.rectPropRewrite.height || 'h']
                        default:
                            return tar[p]
                    }
                },
                set(tar, p, value) {
                    switch (p) {
                        case 'l':
                           tar[v.rectPropRewrite.left || 'l'] = value;
                           break
                        case 't':
                             tar[v.rectPropRewrite.top || 't'] = value;
                            break
                        case 'w':
                            tar[v.rectPropRewrite.width || 'w'] = value;
                            break
                        case 'h':
                             tar[v.rectPropRewrite.height || 'h'] = value;
                             break
                        default:
                            tar[p] = value
                    }
                    return true
                }
            });
        },
        findMin(arr) {
            arr.sort((a, b) => a.dis - b.dis);
            return (arr[0] && arr[0].obj) || null;
        },
        clearCheck() {
            this.checkBoxes.clear();
            this.checkBoxes.forEach(i => {
                this.compIds[i].setActive(false)
            })
        },
        bindDocEvent() {
            document.addEventListener('mousedown', this.clearCheck);
            this.$refs.objectHtml.contentDocument.defaultView.addEventListener('resize', this.resizeBoxDe);
            this.$refs.objectHtml.contentDocument.defaultView.addEventListener('resize', this.setParentSizeToBoxDe);
            // window.addEventListener('resize', this.resizeBoxDe);
            // window.addEventListener('resize', this.setParentSizeToBoxDe);
        },
        clearDocEvent() {
            document.removeEventListener('mousedown', this.clearCheck);
            // window.removeEventListener('resize', this.resizeBoxDe);
            // window.removeEventListener('resize', this.setParentSizeToBoxDe);

        },
        setParentSizeToBox() {
            Object.keys(this.compIds).forEach(i => {
                this.compIds[i].setParentSize(this.box);
            })
        },
        resizeBox() {
            if (!this.oldBox.width) {
                this.oldBox.width = this.oldWidth || this.box.width;
                this.oldBox.height = this.oldHeight || this.box.height;
            }
            this.initBoxSize()
            let ratioW = this.oldBox.width / this.box.width;
            let ratioH = this.oldBox.height / this.box.height;
            this.boxArrBack.forEach(item => {
                if (ratioH !== 1) {
                    item[this.rectPropRewrite.height || 'h'] = numToFixed(item[this.rectPropRewrite.height || 'h'] / ratioH);
                    item[this.rectPropRewrite.top || 't'] = numToFixed(item[this.rectPropRewrite.top || 't'] / ratioH);
                }
                if (ratioW !== 1) {
                    item[this.rectPropRewrite.width || 'w'] = numToFixed(item[this.rectPropRewrite.width || 'w'] / ratioW);
                    item[this.rectPropRewrite.left || 'l'] = numToFixed(item[this.rectPropRewrite.left || 'l'] / ratioW);
                }
            })
            this.oldBox.width = this.box.width;
            this.oldBox.height = this.box.height;
        },
    },
}
</script>

<style scoped lang="scss">
@import "../../global.variate";
@import "../../global.style";

$name: 're_page';
.#{$prefix}-#{$name} {
    &-home {

        width: 100%;
        height: 100%;
        position: relative;
        z-index: 0;
        box-sizing: border-box;
        &:focus {
            outline: none;
        }
    }

    &-stand {
        position: absolute;
        z-index: 9999;
        transform-origin: 0 0;
        top: 0;
        left: 0;
        display: block;
        opacity: 0;
        &-x {
            height: 0;
            width: 100%;
            border-top: 1px dashed $trick-color;
            transform: translateY(0)
        }

        &-y {
            height: 100%;
            width: 0;
            border-right: 1px dashed $trick-color;
            transform: translateX(0)
        }
    }

    &-body {
        position: absolute;
        height: 100%;
        width: 100%;
    }
}
</style>
