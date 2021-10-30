<template>
    <div class="co-re_page-home"
         tabindex="0"
         @keydown="boxKeyDown($event)"
         @keyup="boxKeyUp($event)"
    >
        <div class="co-re_page-body">
            <slot></slot>
        </div>
        <object class="co-re_page-bgc co-re_page-bgc-resize"
                ref="objectHtml"
                height="100%" width="100%" type="text/html" data="about:blank">
        </object>
        <canvas class="co-re_page-bgc co-re_page-bgc-hint" ref="canvas"></canvas>
    </div>
</template>

<script>

import { verifyColor} from "../../tools";
import {throttle, debounce} from "lodash";

export default {
    name: "coRePage",
    props: {
        minShowDis: {
            type: Number,
            default: 6
        },
        boxArr: {
            type: Array,
            default: () => ([])
        },
        idPropName: String,
        toolConfig: {
            type: Object,
            default: () => ({
                useKeyControl: true,
                useStand: true
            })
        },
        tipsColor: {
            type: String,
            default: '#007fd4'
        },
        showDis: {
          type: Boolean,
          default: true
        },
        rectPropRewrite: {
            type: Object,
            default: () => ({
                width: 'w',
                height: 'h',
                top: 't',
                left: 'l'
            })
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
        },
        mouseVerifyDis: {
            type: Number,
            default: 3
        }
    },
    data() {
        let alignDis = new Proxy({'mouse': this.mouseVerifyDis,'keyboard': 1}, {
            get(target, p) {
                return target[p] ?? 0
            }
        })
        return {
            alignDis: alignDis,
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
            keyDownData: {},
            controlStu: false,
            setParentSizeToBoxDe: debounce(this.setParentSizeToBox, 500),
            resizeBoxDe: debounce(this.resizeBox, 30),
            boxArrBack: null,
            clearStandDe: debounce(this.clearStand, 1000),
            ctx: null,
            alignLine: [],
            toolConfigIns: {}
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
        this.ctx = this.$refs.canvas.getContext('2d');
        this.initCtx();
    },
    beforeDestroy() {
        this.clearDocEvent()
    },
    created() {
        Object.assign(this.rectProp, this.rectPropRewrite);
        if(Object.prototype.toString.call(this.toolConfig) === "[object Object]"){
            Object.assign(this.toolConfigIns, {
                useKeyControl: true,
                useStand: true
            }, this.toolConfig)
        }
    },

    computed: {
      canvasBox(){
          return {
              l: 0,
              t: 0,
              w: this.box.width,
              h: this.box.height,
              id: '_canvas_box_'
          }
      },
      tipsColorIns(){
          return verifyColor(this.tipsColor.toString(), '#007fd4')
      }
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
            this.emitOldSize()
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
                this.ctx.clearRect(0, 0, this.box.width, this.box.height);
                let hasKeys = Object.keys(this.compIds);
                let newKeys = [];
                slots?.forEach(item => {
                    const comp = item.componentInstance;
                    if (comp && comp.$options.name === 'coReBox') {
                        newKeys.push(comp.compId);
                        if (this.compIds[comp.compId]) return;
                        this.compIds[comp.compId] = comp;
                        if (this.toolConfigIns.useStand) {
                            comp.$on('resizing', this.resizeEvent.bind(this));
                            comp.$on('resized', this.resizeStop.bind(this));
                        }
                        if (this.toolConfigIns.useKeyControl) {
                            comp.$on('check-box', this.getActiveBox.bind(this));
                            comp.$on('uncheck-box', this.getUnActiveBox.bind(this));
                        }
                    }
                })
                hasKeys.forEach(i => {
                    if(!newKeys.includes(i)){
                        Reflect.deleteProperty(this.compIds, i);
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
                    this.compIds[i]?.setActive(false)
                })
                this.checkBoxes.clear()
                this.checkBoxes.add(compId);
                this.compIds[compId].setActive(true)
            }

        },
        getUnActiveBox({compId}) {
            this.checkBoxes.delete(compId);
        },
        boxKeyDown(event) {
            if(!this.toolConfigIns.useKeyControl) return;
            this.controlStu = event.ctrlKey;
            if (!this.checkBoxes.size) return;
            const done = this.keyDownEvent[event.code || event.keyCode];
            if (done) {
                event.stopPropagation();
                event.preventDefault();
                this.checkBoxes.forEach(val => {
                    this.keyDownData[val] = this.compIds[val].actionMoveByStep.apply(null, this.setStepVal(done))
                });
                this.boxKeyDownEnd();
                this.clearStandDe()
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
            this.keyDownData = {};
        }, 500),
        boxKeyUp(event) {
            if(!this.toolConfigIns.useKeyControl) return;
            this.controlStu = event.ctrlKey;
            // this.clearStandDe();
        },
        setStepVal([add, top]) {
            return [add ? this.keyStep : -this.keyStep, top]
        },
        resizeStop() {
            this.clearStand()
        },
        emitOldSize: debounce(function () {
            this.$emit('update:oldWidth', this.box.width);
            this.$emit('update:oldHeight', this.box.height);
        }, 200),
        resizeEvent: throttle(function ({rect, boxId, compId, type, eventType}) {
            let diffData = this.alignBoxTwo(rect, boxId, eventType);
            let alignArr = this.setAlignBoxTips(diffData, {rect, boxId, compId, type});
            this.ctx.clearRect(0, 0, this.box.width, this.box.height);
            this.setCtxColor();
            alignArr.forEach(item => this.drawLine(item, 'align'));
            if(this.showDis){
                let numberArr = this.setAlignNumTips(diffData, rect);
                numberArr.forEach(item => this.drawLine(item, 'val'));
            }
        }, 0, {
            trailing: false
        }),
        clearStand() {
            this.ctx?.clearRect(0, 0, this.box.width, this.box.height);
        },

        alignBoxTwo(newRect, moduleId, type) {
            const {l, h, w, t} = newRect;
            const aX = l + w / 2;
            const aY = t + h / 2;
            const r = l + w;
            const b = t + h;
            let diffLArr = [];
            let diffTArr = [];

            [...this.boxArrBack, this.canvasBox].forEach((item) => {
                if (item.id === moduleId) return
                const {h: iH, w: iW, t: iT, l: iL} = item;
                const bX = iL + iW / 2;
                const bY = iT + iH / 2;
                let xMetaData = [{bProp: 'l', val: iL}, {bProp: 'lc', val: iL + iW / 2}, {bProp: 'r', val: iL + iW}];
                let yMetaData = [{bProp: 't', val: iT}, {bProp: 'tc', val: iT + iH / 2}, {bProp: 'b', val: iT + iH}];

                let lDiffV = xMetaData.map(i => Object.assign({}, i, {diffV: Math.abs(i.val - l), aProp: 'l'}))
                    .sort((a, b) => a.diffV - b.diffV)[0];
                let lcDiffV = xMetaData.map(i => Object.assign({}, i, {diffV: Math.abs(i.val - aX), aProp: 'lc'}))
                    .sort((a, b) => a.diffV - b.diffV)[0];
                let rDiffV = xMetaData.map(i => Object.assign({}, i, {diffV: Math.abs(i.val - r), aProp: 'r'}))
                    .sort((a, b) => a.diffV - b.diffV)[0];
                let tDiffV = yMetaData.map(i => Object.assign({}, i, {diffV: Math.abs(i.val - t), aProp: 't'}))
                    .sort((a, b) => a.diffV - b.diffV)[0];
                let tcDiffV = yMetaData.map(i => Object.assign({}, i, {diffV: Math.abs(i.val - aY), aProp: 'tc'}))
                    .sort((a, b) => a.diffV - b.diffV)[0];
                let bDiffV = yMetaData.map(i => Object.assign({}, i, {diffV: Math.abs(i.val - b), aProp: 'b'}))
                    .sort((a, b) => a.diffV - b.diffV)[0];
                let alignL = [];
                lDiffV.diffV < this.alignDis[type] && alignL.push(lDiffV);
                rDiffV.diffV < this.alignDis[type] && alignL.push(rDiffV);
                if (lcDiffV.diffV < this.alignDis[type] && !alignL.length) {
                    alignL.push(lcDiffV)
                }

                let alignT = [];
                tDiffV.diffV < this.alignDis[type] && alignT.push(tDiffV);
                bDiffV.diffV < this.alignDis[type] && alignT.push(bDiffV);
                if (tcDiffV.diffV < this.alignDis[type] && !alignT.length) {
                    alignT.push(tcDiffV)
                }
                let disBox = {
                    disX: Math.abs(Math.abs(aX - bX) - w / 2 - iW / 2),
                    disY: Math.abs(Math.abs(aY - bY) - h / 2 - iH / 2),
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
                this.compIds[i]?.setActive(false)
            })
        },
        bindDocEvent() {
            setTimeout(() => {
                this.$refs.objectHtml.contentDocument.defaultView.addEventListener('resize', this.resizeBoxDe);
                this.$refs.objectHtml.contentDocument.defaultView.addEventListener('resize', this.setParentSizeToBoxDe);
            }, 500)
        },
        clearDocEvent() {
            document.removeEventListener('mousedown', this.clearCheck);
        },
        setParentSizeToBox() {
            Object.keys(this.compIds).forEach(i => {
                this.compIds[i]?.setParentSize(this.box);
            })
        },
        // 页面大小变化
        resizeBox() {
            if (!this.oldBox.width) {
                this.oldBox.width = this.oldWidth || this.box.width;
                this.oldBox.height = this.oldHeight || this.box.height;
            }
            this.initBoxSize()
            this.initCtx();
            let ratioW = this.oldBox.width / this.box.width;
            let ratioH = this.oldBox.height / this.box.height;
            this.boxArrBack.forEach(item => {
                if (ratioH !== 1) {
                    item[this.rectPropRewrite.height || 'h'] = Math.round(item[this.rectPropRewrite.height || 'h'] / ratioH);
                    item[this.rectPropRewrite.top || 't'] = Math.round(item[this.rectPropRewrite.top || 't'] / ratioH);
                }
                if (ratioW !== 1) {
                    item[this.rectPropRewrite.width || 'w'] = Math.round(item[this.rectPropRewrite.width || 'w'] / ratioW);
                    item[this.rectPropRewrite.left || 'l'] = Math.round(item[this.rectPropRewrite.left || 'l'] / ratioW);
                }
            })
            this.oldBox.width = this.box.width;
            this.oldBox.height = this.box.height;
        },
        initCtx() {
            this.$refs.canvas.width = this.box.width;
            this.$refs.canvas.height = this.box.height;
            const scale = window.devicePixelRatio;
            this.ctx.scale(scale, scale);

            this.ctx.font = '16px Microsoft YaHei';
        },
        setCtxColor(){
            this.ctx.strokeStyle = this.tipsColorIns;
            this.ctx.fillStyle = this.tipsColorIns;
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
                let xV = this.isMaxSize(start[0], this.box.width);
                this.ctx.moveTo(xV, start[1]);
                this.ctx.lineTo(xV, end[1]);
            } else {
                let yV = this.isMaxSize(start[1], this.box.height);
                this.ctx.moveTo(start[0], yV);
                this.ctx.lineTo(end[0], yV);
            }
            this.ctx.stroke()

            if (linType === 'val' && val >= this.minShowDis) {
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
