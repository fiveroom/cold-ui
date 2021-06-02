<template>
    <div class="co-re_box-home"
         :style="[ transFormStyle, { 'z-index': this.zIndex, 'will-change': this.willChange}]"
         @mousedown.stop="mouseDownEvent"
         tabindex="0"
    >
        <div class="co-re_box-body">
            <slot>{{naaa}}</slot>
        </div>
        <i class="co-re_box-move"  data-movetype="move"></i>
        <template v-if="openTrick">
            <i class="co-re_box-trick"  v-for="i in trickList" :key="i" :class="`co-re_box-trick-${i}`" :data-movetype="i"></i>
        </template>
    </div>
</template>

<script>
// event : resizing dragging resized
import { throttle } from "lodash";

export default {
    name: "CoReBox",
    props: {
        openTrick: {
            type: Boolean,
            default: true,

        },
        height: {
            type: Number,
            default: 100
        },
        width: {
            type: Number,
            default: 100
        },
        top: {
            type: Number,
            default: 0
        },
        left: {
            type: Number,
            default: 0
        },
        minWidth:{
            type: Number,
            default: 50
        },
        minHeight:{
            type: Number,
            default: 50
        },
        zIndex: {
            type: Number,
            default: 0
        },
        usePercent: {
            type: Boolean,
            default: true
        }
    },
    data(){
        return {
            lock: false,
            trickList: ["tr", "tc", "tl", "br", "bl", "bc", "lc", "rc"],
            mouseDown: false,
            location: {
                translateX: 0,
                translateY: 0
            },
            parentSize: {
                width: 0,
                height: 0
            },
            sizeData: {
                xDis: 0,
                yDis: 0,
                oldLeft: 0,
                oldTop: 0
            },
            parentDis: {
                xV: 0,
                yV: 0
            },
            mouseAction: '',
            openWillChange: false,
            naaa: 123
        }
    },
    methods: {
        setDataM(data){
            this.naaa = data;
        },
        getParentInfo(){
            const parent = this.$el.offsetParent;
            this.parentSize = {
                width: parent.clientWidth,
                height: parent.clientHeight,
            }
            const rect = parent.getBoundingClientRect();
            // 元素在页面上的位置
            this.parentDis = {
                xV: rect.left + parent.clientLeft,
                yV: rect.top + parent.clientTop
            }
        },
        boxMove: throttle(function (event){
            if(this.mouseDown){
                event.preventDefault();
                if(this.mouseAction){

                    let location = {
                        w: this.width,
                        h: this.height,
                        l: this.left,
                        t: this.top
                    };
                    // 鼠标在父元素中的位置
                    let absDisP = {
                        xV: event.pageX - this.parentDis.xV,
                        yV: event.pageY - this.parentDis.yV,
                    }
                    // console.log('absDisP :>> ', absDisP);
                    if (this.mouseAction === 'move') {
                        location = this.actionMove(absDisP);
                    } else {
                        if (this.mouseAction.includes('b'))
                            Object.assign(location, this.actionB(absDisP))
                        if (this.mouseAction.includes('t'))
                            Object.assign(location, this.actionT(absDisP))
                        if (this.mouseAction.includes('l'))
                            Object.assign(location, this.actionL(absDisP))
                        if (this.mouseAction.includes('r'))
                            Object.assign(location, this.actionR(absDisP))
                    }
                    this.changeSize(location);
                }
            }
        }, 50),
        //: throttle(function  90),
        // boxMove(event){
        //     if(this.mouseDown){
        //         event.preventDefault();
        //         if(this.mouseAction){
        //
        //             let location = {
        //                 w: this.width,
        //                 h: this.height,
        //                 l: this.left,
        //                 t: this.top
        //             };
        //             // 鼠标在父元素中的位置
        //             let absDisP = {
        //                 xV: event.pageX - this.parentDis.xV,
        //                 yV: event.pageY - this.parentDis.yV,
        //             }
        //             // console.log('absDisP :>> ', absDisP);
        //             if (this.mouseAction === 'move') {
        //                 location = this.actionMove(absDisP);
        //             } else {
        //                 if (this.mouseAction.includes('b'))
        //                     Object.assign(location, this.actionB(absDisP))
        //                 if (this.mouseAction.includes('t'))
        //                     Object.assign(location, this.actionT(absDisP))
        //                 if (this.mouseAction.includes('l'))
        //                     Object.assign(location, this.actionL(absDisP))
        //                 if (this.mouseAction.includes('r'))
        //                     Object.assign(location, this.actionR(absDisP))
        //             }
        //             this.changeSize(location);
        //         }
        //     }
        // },
        mouseDownEvent(event){
            const { movetype: moveType } = event.target.dataset;
            this.mouseDown = true;
            this.mouseAction = moveType;
            if(moveType === 'move'){
                // 鼠标点击时与父元素距离
                this.sizeData = {
                    xDis: event.pageX - this.parentDis.xV,
                    yDis: event.pageY - this.parentDis.yV,
                    oldLeft: this.left,
                    oldTop: this.top
                }
            }
        },
        changeSize(location){
            this.$emit('update:width', location.w);
            this.$emit('update:height', location.h);
            this.$emit('update:top', location.t);
            this.$emit('update:left', location.l);
            this.$emit('resizing', location);
        },
        actionMove(evt) {
            let needL = evt.xV - this.sizeData.xDis + this.sizeData.oldLeft;
            let needT = evt.yV - this.sizeData.yDis + this.sizeData.oldTop;
            if (needL < 0) {
                needL = 0;
            } else if (needL + this.width > this.parentSize.width) {
                needL = this.maxValue.maxLeft
            }
            if (needT < 0) {
                needT = 0;
            } else if (needT + this.height > this.parentSize.height) {
                needT = this.maxValue.maxTop;
            }
            return {
                l: needL,
                t: needT,
                h: this.height,
                w: this.width
            }
        },

        actionR(evt) {
            let needW = evt.xV - this.left;
            if (needW + this.left > this.parentSize.width) {
                needW = this.parentSize.width - this.left
            } else if (needW < this.minWidth) {
                needW = this.minWidth
            }
            return {
                w: needW
            }
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
            return {
                w: needW,
                l: needL,
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
            return {
                h: needH,
                t: needT
            }
        },

        actionB(evt) {
            let needH = evt.yV - this.top;
            if (needH + this.top > this.parentSize.height) {
                needH = this.parentSize.height - this.top;
            } else if (needH < this.minHeight) {
                needH = this.minHeight;
            }
            return {
                h: needH
            }
        },

        closeDown(){
            this.mouseDown = false;
            this.mouseAction = '';
        },

        mouseUp(){
            this.$emit('resized', {w: this.width, h: this.height, t: this.top, l: this.left});
            this.mouseAction = '';
        },

        addEvent(){
            document.documentElement.addEventListener('mousemove', this.boxMove);
            document.documentElement.addEventListener('mousedown', this.closeDown);
            document.documentElement.addEventListener('mouseup', this.mouseUp);
        },
        clearEvent(){
            document.documentElement.removeEventListener('mousemove', this.boxMove);
            document.documentElement.removeEventListener('mousedown', this.closeDown);
            document.documentElement.removeEventListener('mouseup', this.mouseUp);
        }
    },
    created() {

    },
    mounted() {
        this.getParentInfo();
        this.addEvent();
    },
    beforeDestroy() {
        this.clearEvent();
    },
    computed: {
        size(){
            return {
                width: this.width + 'px',
                height: this.height + 'px',
            }
        },
        transFormStyle(){
            return {
                'transform': `translate(${this.left}${this.unit}, ${this.top}${this.unit})`
            }
        },
        unit(){
           return this.usePercent ? '%' : 'px';
        },
        maxValue(){
            return {
                maxTop: this.parentSize.height - this.height,
                maxLeft: this.parentSize.width - this.width,
            }
        },
        willChange(){
            return this.mouseAction ? 'transform' : 'auto'
        }
    }

}
</script>

<style scoped lang="scss">
@import "../../global.scss";
$name: 're_box';
.#{$prefix}-#{$name}-home{
    background-color: skyblue;
    position: absolute;
    z-index: 0;
    top: 0;
    left: 0;
    width: 100px;
    height: 100px;
    transform-origin: 0 0;
    transition: transform .13s;
    &:focus{
        //background-color: red;
    }
}

.#{$prefix}-#{$name}-trick {
    width: 8px;
    height: 8px;
    box-sizing: border-box;
    position: absolute;
    display: block;
    font-size: 1px;
    background: #fff;
    border: 1px solid #6c6c6c;
    -webkit-box-shadow: 0 0 2px #bbb;
    box-shadow: 0 0 2px #bbb;
    z-index: 2;

    &-tr {
        top: -4px;
        right: -4px;
    }

    &-tl {
        top: -4px;
        left: -4px;
    }

    &-tc {
        top: -4px;
        left: 50%;
        transform: translateX(-50%);
    }

    &-br {
        bottom: -4px;
        right: -4px;
    }

    &-bl {
        bottom: -4px;
        left: -4px;
    }

    &-bc {
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
    }

    &-lc {
        left: -4px;
        top: 50%;
        transform: translateY(-50%);
    }

    &-rc {
        right: -4px;
        top: 50%;
        transform: translateY(-50%);
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
    }

    &-lc,
    &-rc {
        cursor: ew-resize;
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
</style>
