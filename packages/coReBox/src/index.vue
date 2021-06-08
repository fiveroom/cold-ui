<template>
    <div
        class="co-re_box-home"
        :class="{'co-re_box-is-move': mouseAction, 'co-re_box-home-animal': this.openAnimal}"
        :style="{ 'z-index': this.zIndex, 'will-change': this.willChange}"
        @mousedown.stop="mouseDownEvent"
        tabindex="0"
    >
        <div class="co-re_box-body">
            <slot>{{compId}}</slot>
        </div>
        <i
            class="co-re_box-move"
            data-movetype="move"
            v-show="!lock"
        ></i>
        <template v-if="openTrick && !lock">
            <i
                class="co-re_box-trick"
                v-for="i in trickList"
                v-show="boxActive"
                :key="i"
                :class="`co-re_box-trick-${i}`"
                :data-movetype="i"
            ></i>
        </template>
    </div>
</template>

<script>
// event : resizing dragging resized check-box
import { uId } from '../../tools';
import {debounce, throttle} from "lodash";


export default {
    name: "coReBox",
    props: {
        openTrick: {
            type: Boolean,
            default: true,
        },
        h: {
            type: Number,
            default: 100
        },
        w: {
            type: Number,
            default: 100
        },
        t: {
            type: Number,
            default: 0
        },
        l: {
            type: Number,
            default: 0
        },
        minWidth: {
            type: Number,
            default: 50
        },
        minHeight: {
            type: Number,
            default: 50
        },
        zIndex: {
            type: Number,
            default: 0
        },
        usePercent: {
            type: Boolean,
            default: false
        },
        boxId: {
            type: [String, Number],
            default: ''
        },
        openAnimal: {
          type: Boolean,
          default: false
        },
        getSizeFunc: Function,
        parentSize: {
            type: Object,
            default: null
        },
        auToParentSize: false,
        lock: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            trickList: ["tr", "tc", "tl", "br", "bl", "bc", "lc", "rc"],
            location: {
                translateX: 0,
                translateY: 0
            },
            sizeData: {
                lDis: 0,
                tDis: 0
            },
            parentDis: {
                xV: 0,
                yV: 0,
                width: 0,
                height: 0
            },
            mouseAction: '',
            openWillChange: false,
            width: 50,
            top: 0,
            left: 0,
            height: 50,
            compId: uId(),
            boxActive: false,
            resizeEndDe: null,
            getParentInfoDe: null,
            reloadDe: debounce(this.reload, 50)
        }
    },
    methods: {
        getParentInfo() {
            const parent = this.$el.offsetParent;
            const rect = parent.getBoundingClientRect();
            // 元素在页面上的位置
            this.parentDis = {
                xV: rect.left + parent.clientLeft + window.scrollX,
                yV: rect.top + parent.clientTop + window.scrollY,
                width: rect.width,
                height: rect.height
            }
        },
        boxMove(event) {
            if(this.lock) return;
            if (this.mouseAction) {
                event.preventDefault();
                // 鼠标在父元素中的位置
                if (this.mouseAction === 'move') {
                    let absDisP = {
                        xV: event.pageX,
                        yV: event.pageY,
                    }
                    this.actionMove(event.pageX - this.sizeData.lDis, event.pageY - this.sizeData.tDis);
                } else {
                    let location = {};
                    let absDisP = {
                        xV: event.pageX - this.parentDis.xV,
                        yV: event.pageY - this.parentDis.yV,
                    }
                    if (this.mouseAction.includes('b'))
                        Object.assign(location, this.actionB(absDisP))
                    else if (this.mouseAction.includes('t'))
                        Object.assign(location, this.actionT(absDisP))
                    if (this.mouseAction.includes('l'))
                        Object.assign(location, this.actionL(absDisP))
                    else if (this.mouseAction.includes('r'))
                        Object.assign(location, this.actionR(absDisP))
                    this.setResize(location);
                }
                this.$emit('resizing', this.emitResizeData());
            }
        },
        setResize(location) {
            if (Reflect.has(location, 'top') || Reflect.has(location, 'left')) {
                this.setTransfrom()
            }
            if (Reflect.has(location, 'width')) {
                this.setWidth()
            }
            if (Reflect.has(location, 'height')) {
                this.setHeight()
            }
        },
        mouseDownEvent(event) {
            if(this.lock) return;
            if(event.button !== 0) return
            const { movetype: moveType } = event.target.dataset;
            this.mouseAction = moveType;
            if(moveType){
                this.boxActive = true;
                this.$emit('check-box', this.ids);
                if(this.mouseAction === 'move'){
                    this.sizeData = {
                        lDis: event.pageX - this.left,
                        tDis: event.pageY - this.top
                    }
                }
            }
        },
        emitResizeData(){
            return {
                rect: {
                    h: this.height,
                    w: this.width,
                    l: this.left,
                    t: this.top
                },
                boxId: this.boxId,
                compId: this.compId,
            }
        },
        actionMove(left, top) {
            this.left = this.verifyLeft(left);
            this.top = this.verifyTop(top);
            this.setTransfrom()
        },
        actionMoveByStep(step, topStu) {
            if(this.lock) return;
            if(topStu){
                this.top = this.verifyTop(this.top + step);
            } else {
                this.left = this.verifyLeft(this.left + step);
            }
            this.setTransfrom();
            this.$emit('resizing', this.emitResizeData());
            return {
                boxId: this.boxId,
                left: this.left,
                top: this.top
            }
            // this.resizeEndDe()
        },
        verifyLeft(needL){
            if (needL < 0) {
                needL = 0;
            } else if (needL > this.maxValue.maxLeft) {
                needL = this.maxValue.maxLeft
            }
            return needL
        },
        verifyTop(needT){
            if (needT < 0) {
                needT = 0;
            } else if (needT > this.maxValue.maxTop) {
                needT = this.maxValue.maxTop;
            }
            return needT
        },
        actionR(evt) {
            let needW = evt.xV - this.left;
            if (needW + this.left > this.parentDis.width) {
                needW = this.parentDis.width - this.left
            } else if (needW < this.minWidth) {
                needW = this.minWidth
            }
            this.width = needW;
            return {
                width: needW
            }
        },
        setActive(val){
            this.boxActive = val;
        },
        actionL(evt) {
            let needW = this.width - evt.xV + this.left;
            let needL = evt.xV;
            if (needL < 0) {
                needL = 0;
                needW = this.left + this.width;
            }
            if (needW < this.minWidth) {
                needL = this.left + this.width - this.minWidth;
                needW = this.minWidth;
            }
            this.width = needW;
            this.left = needL;
            return {
                width: needW,
                left: needL,
            }
        },
        actionT(evt) {
            let needH = this.height - evt.yV + this.top;
            let needT = evt.yV;
            if (needT < 0) {
                needT = 0;
                needH = this.top + this.height;
            }
            if (needH < this.minHeight) {
                needH = this.minHeight;
                needT = this.top + this.height - this.minHeight;
            }
            this.height = needH;
            this.top = needT;
            return {
                height: needH,
                top: needT
            }
        },
        actionB(evt) {
            let needH = evt.yV - this.top;
            if (needH + this.top > this.parentDis.height) {
                needH = this.parentDis.height - this.top;
            } else if (needH < this.minHeight) {
                needH = this.minHeight;
            }
            this.height = needH;
            return {
                height: needH
            }
        },


        mouseCancel() {
            if (this.mouseAction) {
                this.$emit('update:w', this.width);
                this.$emit('update:h', this.height);
                this.$emit('update:l', this.left);
                this.$emit('update:t', this.top);
                this.$emit('resized', this.emitResizeData());
                this.mouseAction = '';
            }

        },

        mouseDownOther(){
            this.boxActive = false;
            this.$emit('uncheck-box', this.ids)
        },
        addEvent() {
            document.documentElement.addEventListener('mousemove', this.boxMove);
            document.documentElement.addEventListener('mousedown', this.mouseDownOther);
            document.documentElement.addEventListener('mouseup', this.mouseCancel);
            if(this.auToParentSize){
                window.addEventListener('resize', this.getParentInfoDe);
            }
        },
        clearEvent() {
            document.documentElement.removeEventListener('mousemove', this.boxMove);
            document.documentElement.removeEventListener('mousedown', this.mouseDownOther);
            document.documentElement.removeEventListener('mouseup', this.mouseCancel);
            if(this.auToParentSize){
                window.removeEventListener('resize', this.getParentInfoDe);
            }

        },
        setTransfrom() {
            this.$el.style.transform = `translate3d(${this.left}px, ${this.top}px, 0px)`;
        },
        setHeight() {
            this.$el.style.height = this.height + 'px';
        },
        setWidth() {
            this.$el.style.width = this.width + 'px';
        },
        setOpacity() {
            this.$el.style.opacity = '1';
        },
        reload(){
            this.setOpacity();
            this.setTransfrom();
            this.setHeight();
            this.setWidth();
        },
        setParentSize(size){
            this.parentDis = {
                xV: size.xV,
                yV: size.yV,
                width: size.width,
                height: size.height
            }
        }
    },
    created() {
        this.resizeEndDe = debounce(()=>this.$emit('resized', this.emitResizeData()), 500);
        if(this.auToParentSize){
            this.getParentInfoDe = debounce(this.getParentInfo, 500);
        }
        // this.reloadDe = debounce(this.reload, 300);
    },
    mounted() {
        this.getParentInfo();
        this.addEvent();
    },
    beforeDestroy() {
        this.clearEvent();
    },
    computed: {
        maxValue() {
            return {
                maxTop: this.parentDis.height - this.height,
                maxLeft: this.parentDis.width - this.width,
            }
        },
        willChange() {
            return this.mouseAction ? 'transform' : 'auto'
        },
        ids(){
            return {
                boxId: this.boxId,
                compId: this.compId,
            }
        }
    },
    watch: {
        h: {
            immediate: true,
            handler(v) {
                this.height = v;
                this.reloadDe();
            }
        },
        l: {
            immediate: true,
            handler(v) {
                this.left = v;
                this.reloadDe();
            }
        },
        t: {
            immediate: true,
            handler(v) {
                this.top = v;
                this.reloadDe();
            }
        },
        w: {
            immediate: true,
            handler(v) {
                this.width = v;
                this.reloadDe();
            }
        }
    }

}
</script>

<style scoped lang="scss">
@import "../../global.variate";
@import "../../global.style";
$name: 're_box';

$trick-width: 4px;
$trick-padding: 8px;
$trick-out: -2px;
$trick-border: 4px solid #000;
.#{$prefix}-#{$name}-home{
    position: absolute;
    z-index: 0;
    top: 0;
    left: 0;
    transform-origin: 0 0;
    transition-property: box-shadow;
    transition-duration: .2s;
    opacity: 0;
    box-shadow: 0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12);
    &:focus{
        //background-color: red;
        outline: none;
    }

    &:active{
        // transition: box-shadow 200ms cubic-bezier(0, 0, 0.2, 1);
        box-shadow: 0 5px 5px -3px rgba(0,0,0,.2), 0 8px 10px 1px rgba(0,0,0,.1), 0 3px 14px 2px rgba(0,0,0,.12);
    }
    &-animal{
        transition-property: all;
        transition-duration: .2s;
    }
}
.#{$prefix}-#{$name}-trick {
    //width: 8px;
    //height: 8px;
    //box-sizing: border-box;
    position: absolute;
    display: block;
    font-size: 1px;
    z-index: 2;

    &-tr {
        top: $trick-out;
        right: $trick-out;
        border-top-right-radius: 2px;
        border-top: $trick-border;
        border-right: $trick-border;
    }

    &-tl {
        top: $trick-out;
        left: $trick-out;
        border-top-left-radius: 2px;
        border-top: $trick-border;
        border-left: $trick-border;
    }

    &-tc {
        top: $trick-out;
    }

    &-br {
        bottom: $trick-out;
        right: $trick-out;
        border-bottom-right-radius: 2px;
        border-right: $trick-border;
        border-bottom: $trick-border;
    }

    &-bl {
        bottom: $trick-out;
        left: $trick-out;
        border-left: $trick-border;
        border-bottom: $trick-border;
        border-bottom-left-radius: 2px;
    }

    &-bc {
        bottom: $trick-out;
    }

    &-lc {
        left: $trick-out;
    }

    &-rc {
        right: $trick-out;
    }

    &-bl,&-tr,&-br,&-tl{
        width: 6px;
        height: 6px;
    }

    &-bl,
    &-tr {
        cursor: nesw-resize;
    }

    &-br,
    &-tl {
        cursor: nwse-resize;
    }


    &-tc,
    &-bc {
        cursor: ns-resize;
        left: $trick-padding;
        height: $trick-width;
        right: $trick-padding;
    }

    &-lc,
    &-rc {
        cursor: ew-resize;
        top: $trick-padding;
        bottom: $trick-padding;
        width: $trick-width;
    }
}
.#{$prefix}-#{$name}-move{
    position: absolute;
    display: block;
    top: 0;
    width: 100%;
    left: 0;
    background-color: transparent;
    z-index: 1;
    height: 30px;
    cursor: move;
}
.#{$prefix}-#{$name}-body{
    width: 100%;
    height: 100%;
}
.#{$prefix}-#{$name}-is-move{
    user-select: none;

}
</style>
