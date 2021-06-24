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
        <object class="co-re_page-bgc co-re_page-bgc-resize"
                height="100%" width="100%" type="text/html" ref="objectHtml"></object>
        <canvas class="co-re_page-bgc co-re_page-bgc-hint" ref="canvas"></canvas>
    </div>
</template>

<script>

import {getMiDiff, numToFixed} from "../../tools";
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
            minY: {
                hint: '',
                obj: null,
                stu: false,
                val: null,
                diffV: 0
            },
            minX: {
                hint: '',
                obj: null,
                stu: false,
                val: null,
                diffV: 0
            },
            xStand: {
                top: 0,
                value: 'no'
            },
            yStand: {
                left: 0,
                value: 'no'
            },
            alignDis: 4,
            alignTipsWidth: 50,
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
            ctx: null,
            alignLine: []
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
            if (this.oldHeight !== this.oldBox.height) {
                this.oldBox.height = this.oldHeight;
                this.autoFirstResize && this.resizeBoxDe();
            }
        },
        oldWidth() {
            if (this.oldWidth !== this.oldBox.width) {
                this.oldBox.width = this.oldWidth;
                this.autoFirstResize && this.resizeBoxDe();
            }
        }
    },
    mounted() {
        this.initBoxSize()
        this.bindDocEvent();
        this.initCtx();
        this.initCtxStyle();
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
                if (this.xStand.value !== 'no') {
                    obj.t = numToFixed(this.xStand.value);
                }
                if (this.yStand.value !== 'no') {
                    obj.l = numToFixed(this.yStand.value);
                }
                this.clearStand()
                this.emitOldSize();
            })
        },
        emitOldSize() {
            this.$emit('update:oldWidth', this.box.width);
            this.$emit('update:oldHeight', this.box.height);
        },
        resizeEvent: throttle(function ({rect, boxId, compId, type}) {
            // this.pagePost(resizingData.rect);
            // this.alignBox(rect, boxId);
            // this.blockPost(resizingData.rect, resizingData.boxId);
            // if (this.xStand.value !== 'no') {
            //     this.$refs.standX.style.transform = `translateY(${this.xStand.top}px)`;
            //     this.$refs.standX.style.opacity = '1';
            // } else {
            //     this.$refs.standX.style.opacity = '0';
            // }
            // if (this.yStand.value !== 'no') {
            //     this.$refs.standY.style.transform = `translateX(${this.yStand.left}px)`;
            //     this.$refs.standY.style.opacity = '1';
            // } else {
            //     this.$refs.standY.style.opacity = '0';
            // }
            // let alignArr = [];
            // let numberArr = [];
            // if(this.minX.diffV < this.alignDis){
            //     this.minX.stu = true;
            //
            //     let pointY = Math.floor(this.minX.val);
            //     alignArr.push([[0, pointY], [this.box.width , pointY]]);
            //     if(this.minX.obj){
            //         let obj = this.minX.obj;
            //         let numY;
            //         if(rect.t <= obj.t){
            //             numY = Math.floor((rect.t + rect.h + obj.t) / 2)
            //         } else if(rect.t + rect.h >= obj.t + obj.h){
            //             numY = Math.floor((rect.t + obj.t + obj.h) / 2)
            //         } else {
            //             numY = Math.floor(rect.t + rect.h / 2)
            //         }
            //         if(rect.l > obj.l + obj.w){
            //             numberArr.push([
            //                 [Math.floor(obj.l + obj.w), numY],
            //                 [Math.floor(rect.l), numY],
            //                 Math.floor(Math.abs(rect.l - obj.l - obj.w))]);
            //         } else if (rect.l + rect.w < obj.l) {
            //             numberArr.push([
            //                 [Math.floor(rect.l + rect.w), numY],
            //                 [Math.floor(obj.l), numY],
            //                 Math.floor(Math.abs(obj.l- rect.l - rect.w))]);
            //         } else {
            //             numberArr.push([
            //                 [Math.floor(obj.l), numY],
            //                 [Math.floor(rect.l), numY],
            //                 Math.floor(Math.abs(obj.l- rect.l)),
            //             ]);
            //             numberArr.push([
            //                 [Math.floor(rect.l + rect.w), numY],
            //                 [Math.floor(obj.l + obj.w), numY],
            //                 Math.floor(Math.abs(obj.l + obj.w- rect.l - rect.w)),
            //             ]);
            //         }
            //     } else {
            //         let numY = Math.floor(rect.t + rect.h / 2)
            //         let point1 = [[0, numY], [Math.floor(rect.l), numY], Math.floor(rect.l)];
            //         let point2V = Math.abs(Math.floor(this.box.width - rect.l - rect.w));
            //         let point2 = [[Math.floor(rect.l + rect.w), numY],[this.box.width, numY], point2V];
            //         numberArr.push(point1, point2)
            //     }
            // } else {
            //     lineArr.push([[0.5, this.minX.val], [this.box.width + .5, this.minX.val]])
            // }
            // }

            // if(this.minY.diffV < this.alignDis){
            //     this.minY.stu = false;
            //     alignArr.push()
            //     // if(this.minY.obj){
            //     let pointX = Math.floor(this.minY.val) ;
            //     alignArr.push([[pointX, 0], [pointX, this.box.height]])
            //     if(this.minY.obj){
            //
            //     } else {
            //         let point1V = Math.floor(rect.t);
            //         let numX = Math.floor(rect.l + rect.w / 2);
            //
            //         if(point1V > 4){
            //             let point1 = [[numX, 0], [numX, point1V], point1V];
            //             numberArr.push(point1);
            //         }
            //         let point2V = Math.floor(Math.abs(rect.t + rect.h - this.box.height));
            //         if(point2V > 4){
            //             let point2 = [[numX, Math.floor(rect.t + rect.h)], [numX, this.box.height], point2V];
            //             numberArr.push(point2)
            //         }
            //     }
            // } else {
            //     lineArr.push([[this.minY.val, 0], [this.minY.val, this.box.height]])
            // }
            // }

            let diffData = this.alignBoxTwo(rect, boxId);
            let alignArr = this.setAlignBoxTips(diffData, {rect, boxId, compId, type});
            let numberArr = this.setAlignNumTips(diffData, rect)
            this.ctx.clearRect(0, 0, this.box.width, this.box.height);
            alignArr.forEach(item => this.drawLine(item, 'align'));
            numberArr.forEach(item => this.drawLine(item, 'val'));
        }, 0, {
            trailing: false
        }),
        clearStand() {
            // this.$refs.standY.style.opacity = '0';
            // this.$refs.standY.style.transform = 'translateY(0px)';
            // this.$refs.standX.style.opacity = '0';
            // this.$refs.standX.style.transform = 'translateX(0px)';
            // this.yStand.value = "no";
            // this.xStand.value = "no";

            // setTimeout(() => {
            this.ctx.clearRect(0, 0, this.box.width, this.box.height);
            // }, 500)
        },
        alignBoxTwo(newRect, moduleId) {
            const {l, h, w, t} = newRect;
            const aX = l + w / 2;
            const aY = t + h / 2;
            const r = l + w;
            const b = t + h;
            let diffLArr = [];
            let diffTArr = [];
            this.boxArrBack.forEach((item) => {
                if (item.id === moduleId) return
                const {h: iH, w: iW, t: iT, l: iL} = item;
                const bX = iL + iW / 2;
                const bY = iT + iH / 2;
                let xMetaData = [{bProp: 'l', val: iL}, {bProp: 'lc', val: iL + iW / 2}, {bProp: 'r', val: iL + iW}];
                let yMetaData = [{bProp: 't', val: iT}, {bProp: 'tc', val: iT + iH / 2}, {bProp: 'b', val: iT + iH}];

                let lDiffV = xMetaData.map(i => Object.assign({...i}, {diffV: Math.abs(i.val - l), aProp: 'l'}))
                    .sort((a, b) => a.diffV - b.diffV)[0];
                let lcDiffV = xMetaData.map(i => Object.assign({...i}, {diffV: Math.abs(i.val - aX), aProp: 'lc'}))
                    .sort((a, b) => a.diffV - b.diffV)[0];
                let rDiffV = xMetaData.map(i => Object.assign({...i}, {diffV: Math.abs(i.val - r), aProp: 'r'}))
                    .sort((a, b) => a.diffV - b.diffV)[0];
                let tDiffV = yMetaData.map(i => Object.assign({...i}, {diffV: Math.abs(i.val - t), aProp: 't'}))
                    .sort((a, b) => a.diffV - b.diffV)[0];
                let tcDiffV = yMetaData.map(i => Object.assign({...i}, {diffV: Math.abs(i.val - aY), aProp: 'tc'}))
                    .sort((a, b) => a.diffV - b.diffV)[0];
                let bDiffV = yMetaData.map(i => Object.assign({...i}, {diffV: Math.abs(i.val - b), aProp: 'b'}))
                    .sort((a, b) => a.diffV - b.diffV)[0];
                let alignL = [];
                lDiffV.diffV < this.alignDis && alignL.push(lDiffV);
                rDiffV.diffV < this.alignDis && alignL.push(rDiffV);
                if (lcDiffV.diffV < this.alignDis && !alignL.length) {
                    alignL.push(lcDiffV)
                }

                let alignT = [];
                tDiffV.diffV < this.alignDis && alignT.push(tDiffV);
                bDiffV.diffV < this.alignDis && alignT.push(bDiffV);
                if (tcDiffV.diffV < this.alignDis && !alignT.length) {
                    alignT.push(tcDiffV)
                }
                let disBox = {
                    disX: Math.abs(aX - bX) - w / 2 - iW / 2,
                    disY: Math.abs(aY - bY) - h / 2 - iH / 2,
                    obj: item
                }
                if(alignL.length){
                    diffLArr.push({alignL, ...disBox})
                }
                if(alignT.length){
                    diffTArr.push({alignT, ...disBox})
                }
            })
            return {
                diffLObj: diffLArr.sort((a, b) => a.disY - b.disY)[0],
                diffTObj: diffTArr.sort((a, b) => a.disX - b.disX)[0]
            }
        },
        setAlignBoxTips({diffLObj, diffTObj}, {rect, compId, type}) {
            let alignArr = [];
            if(diffLObj){
                const obj = diffLObj.obj;
                diffLObj.alignL.forEach(item => {
                    if (type === 'move') {
                        let val;
                        switch (item.aProp) {
                            case 'l':
                                val = item.val;
                                break;
                            case 'lc':
                                val = Math.round(item.val - rect.w / 2);
                                break;
                            default:
                                val = item.val - rect.w;
                        }
                        rect.l = val;
                        this.compIds[compId].left = val;
                        this.compIds[compId].setTransform(this.compIds[compId].left, this.compIds[compId].top);
                    }
                    let xPoint = Math.floor(item.val);
                    let yPoint0 = Math.floor(Math.min(obj.t, rect.t) - this.alignTipsWidth);
                    let yPoint1 = Math.floor(Math.max(obj.t + obj.h, rect.t + rect.h) + this.alignTipsWidth);
                    alignArr.push([[xPoint, yPoint0], [xPoint, yPoint1]])
                })
            }
            if(diffTObj){
                const obj = diffTObj.obj;
                diffTObj.alignT.forEach(item => {
                    if (type === 'move') {
                        let val;
                        switch (item.aProp) {
                            case 't':
                                val = item.val;
                                break;
                            case 'tc':
                                val = Math.round(item.val - rect.h / 2);
                                break;
                            default:
                                val = item.val - rect.h;
                        }
                        rect.t = val;
                        this.compIds[compId].top = val;
                        this.compIds[compId].setTransform(this.compIds[compId].left, this.compIds[compId].top);
                    }
                    let yPoint = Math.floor(item.val);
                    let xPoint0 = Math.floor(Math.min(obj.l, rect.l) - this.alignTipsWidth);
                    let xPoint1 = Math.floor(Math.max(obj.l + obj.w, rect.l + rect.w) + this.alignTipsWidth);
                    alignArr.push([[xPoint0, yPoint], [xPoint1, yPoint]])
                })
            }
            return alignArr
        },
        setAlignNumTips({diffLObj, diffTObj}, rect){
            let numTipsArr = [];
            if(diffLObj){
                let obj = diffLObj.obj;
                let aB =  Math.round(rect.t + rect.h);
                let bB = Math.round(obj.t + obj.h);
                let aR = rect.l + rect.w;
                let bR = obj.l + obj.w;
                let aY = rect.t + rect.h / 2;
                let aX = rect.l + rect.w / 2;
                let bY = obj.t + obj.h / 2;
                let bX = obj.l + obj.w / 2;
                let disY = Math.round( Math.abs(rect.t + rect.h / 2 - obj.t - obj.h /2) - obj.h / 2 - rect.h / 2);
                let disX =  Math.round( Math.abs(rect.l + rect.w / 2 - obj.l - obj.w /2) - obj.w / 2 - rect.w / 2);
                let numXPoint;
                if(disX < 0){
                    if(diffLObj.alignL[0].aProp !== 'lc'){
                        numXPoint = Math.floor(rect.l >= obj.l ? (rect.l + Math.min(aR, bR)) / 2 : (rect.l + rect.w + obj.l) / 2);
                    } else {
                        numXPoint = Math.floor(rect.l + rect.w / 2);
                    }
                } else {
                    numXPoint = Math.floor(aX - bX > 0 ? rect.l : rect.l + rect.w);
                }
                if(disY < 0){
                    numTipsArr.push(
                        [[numXPoint, rect.t],[numXPoint, obj.t], Math.abs(rect.t - obj.t)],
                        [[numXPoint, aB],[numXPoint, bB], Math.abs(aB - bB)]
                    )
                } else if(aY - bY > 0){
                    numTipsArr.push([[numXPoint, rect.t], [numXPoint, bB], Math.abs(rect.t - bB)])
                } else {
                    numTipsArr.push([[numXPoint, aB], [numXPoint, obj.t], Math.abs(aB - obj.t)])
                }
            }
            if(diffTObj){
                let obj = diffTObj.obj;
                let bR = obj.l + obj.w;
                let bB = obj.t + obj.h;
                let aB = rect.t + rect.h;
                let aR = rect.l + rect.w;
                let aY = rect.t + rect.h / 2;
                let aX = rect.l + rect.w / 2;
                let bY = obj.t + obj.h / 2;
                let bX = obj.l + obj.w / 2;
                let disY = Math.round( Math.abs(rect.t + rect.h / 2 - obj.t - obj.h /2) - obj.h / 2 - rect.h / 2);
                let disX =  Math.round( Math.abs(rect.l + rect.w / 2 - obj.l - obj.w /2) - obj.w / 2 - rect.w / 2);
                let numYPoint;
                if(disY < 0){
                    if(diffTObj.alignT[0].aProp !== 'tc'){
                        numYPoint = Math.floor(rect.t >= obj.t ? (rect.t + Math.min(aB, bB)) / 2 : (rect.t + rect.h + obj.t) / 2);
                    } else {
                        numYPoint = Math.floor(rect.t + rect.h / 2);
                    }
                } else  {
                    numYPoint = Math.floor(aY - bY > 0 ? rect.t : rect.t + rect.h);
                }
                if(disX < 0){
                    numTipsArr.push(
                        [[rect.l, numYPoint],[obj.l, numYPoint], Math.abs(rect.l - obj.l)],
                        [[aR, numYPoint],[bR, numYPoint], Math.abs(aR - bR)]
                    )
                } else if(aX - bX > 0){
                    numTipsArr.push([[rect.l, numYPoint], [bR, numYPoint], Math.abs(rect.l - bR)])
                } else {
                    numTipsArr.push([[aR, numYPoint], [obj.l, numYPoint], Math.abs(aR - obj.l)])
                }
            }
            return numTipsArr
        },
        alignBox(newRect, moduleId) {
            /**
             *  TODO 1、最近盒子计算失败。2、object元素在火狐浏览器不兼容，无法正确渲染窗口。3、基准线不够准确。4、判断优化
             *
             */
            this.minY = [
                {val: newRect.l, hint: 'l', diffV: Math.abs(newRect.l - this.box.centerW)},
                {
                    val: newRect.l + newRect.w / 2,
                    hint: '_lc_',
                    diffV: Math.abs(newRect.l + newRect.w / 2 - this.box.centerW)
                },
                {val: newRect.l + newRect.w, hint: 'r', diffV: Math.abs(newRect.l + newRect.w - this.box.centerW)}
            ].sort((a, b) => a.diffV - b.diffV)[0];
            this.minY.val = this.box.centerW;
            this.minY.stu = false;
            this.minX = [
                {val: newRect.t, hint: 't', diffV: Math.abs(newRect.t - this.box.centerH)},
                {
                    val: newRect.t + newRect.h / 2,
                    hint: '_tc_',
                    diffV: Math.abs(newRect.t + newRect.h / 2 - this.box.centerH)
                },
                {val: newRect.t + newRect.h, hint: 'b', diffV: Math.abs(newRect.t + newRect.h - this.box.centerH)}
            ].sort((a, b) => a.diffV - b.diffV)[0];
            this.minX.val = this.box.centerH;
            this.minX.stu = false;
            this.boxArrBack.forEach(item => {
                if (item[this.idPropName] === moduleId) return
                let yData = [item.l, item.l + item.w / 2, item.l + item.w];
                let xData = [item.t, item.t + item.h / 2, item.t + item.h];
                let minYTarget = [
                    getMiDiff(yData, newRect.l, 'l'),
                    getMiDiff(yData, newRect.l + newRect.w / 2, '_lc_'),
                    getMiDiff(yData, newRect.l + newRect.w, 'r')
                ].sort((a, b) => a.diffV - b.diffV)[0];

                let minXTarget = [
                    getMiDiff(xData, newRect.t, 't'),
                    getMiDiff(xData, newRect.t + newRect.h / 2, '_tc_'),
                    getMiDiff(xData, newRect.t + newRect.h, 'b')
                ].sort((a, b) => a.diffV - b.diffV)[0];

                if (this.minX.diffV > minXTarget.diffV) {
                    Object.assign(this.minX, minXTarget, {obj: item})
                }
                if (this.minY.diffV > minYTarget.diffV) {
                    Object.assign(this.minY, minYTarget, {obj: item})
                }
            });
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
                        case 'id':
                            return tar[v.idPropName || 'id']
                        case '_lc_':
                            return tar[v.rectPropRewrite.left || 'l'] + tar[v.rectPropRewrite.width || 'w'] / 2
                        case '_tc_':
                            return tar[v.rectPropRewrite.top || 't'] + tar[v.rectPropRewrite.height || 'h'] / 2
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
        initCtx() {
            this.$refs.canvas.width = this.box.width;
            this.$refs.canvas.height = this.box.height;
        },
        initCtxStyle() {
            this.ctx = this.$refs.canvas.getContext('2d');
            const scale = window.devicePixelRatio;
            this.ctx.scale(scale, scale);
            this.ctx.strokeStyle = '#007fd4';
            this.ctx.fillStyle = '#007fd4';
            this.ctx.font = '16px Microsoft YaHei';
            this.ctx.lineWidth = 0.5;
        },
        drawLine([start, end, val], linType = '') {
            this.ctx.beginPath()
            this.ctx.lineWidth = 1;
            if (linType === 'align') {
                this.ctx.setLineDash([8, 2, 4, 2]);
            } else {
                this.ctx.setLineDash([]);
            }
            if (start[0] === end[0]) {
                this.ctx.moveTo(start[0] + .5, start[1]);
                this.ctx.lineTo(end[0] + .5, end[1]);
            } else {
                this.ctx.moveTo(start[0], start[1] + .5);
                this.ctx.lineTo(end[0], end[1] + .5);
            }
            this.ctx.stroke()
            if (linType === 'val' && val > 10) {
                this.ctx.beginPath()
                let vPara = [val];
                this.ctx.lineWidth = 2;
                if (start[0] === end[0]) {
                    let topV = this.isMaxSize(start[1], this.box.height);
                    this.ctx.moveTo(start[0] - 6, topV);
                    this.ctx.lineTo(start[0] + 6, topV);
                    let bottomV = this.isMaxSize(end[1], this.box.height);
                    this.ctx.moveTo(end[0] - 6, bottomV);
                    this.ctx.lineTo(end[0] + 6, bottomV);
                    this.ctx.textBaseline = 'middle';
                    vPara.push(start[0] + 5, (start[1] + end[1]) / 2);
                } else {
                    let leftX = this.isMaxSize(start[0], this.box.width);
                    this.ctx.moveTo(leftX, start[1] - 6);
                    this.ctx.lineTo(leftX, start[1] + 6);
                    let rightX = this.isMaxSize(end[0], this.box.width);
                    this.ctx.moveTo(rightX, end[1] - 6);
                    this.ctx.lineTo(rightX, end[1] + 6);
                    this.ctx.textBaseline = 'bottom';
                    let textMetrics = this.ctx.measureText(val);
                    vPara.push((start[0] + end[0] - textMetrics.width) / 2, start[1] - 5);
                }
                this.ctx.fillText.apply(this.ctx, vPara);
                this.ctx.stroke()
            }

        },
        isMaxSize(val, sourceV) {
            let v = val + .5
            if (v > sourceV) {
                return val - .5
            }
            return v
        },
        drawBarrier(pointer, type) {

        }
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
        z-index: 2;
    }

    &-bgc {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;

        &-resize {
            z-index: -1;
        }

        &-hint {
            z-index: 3;
            pointer-events: none;
        }
    }
}
</style>
