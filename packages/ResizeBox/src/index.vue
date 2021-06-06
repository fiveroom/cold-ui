<template>
    <div
        class="co-re_box-home"
        :class="{'co-re_box-is-move': mouseAction}"
        :style="{ 'z-index': this.zIndex, 'will-change': this.willChange}"
        @mousedown.stop="mouseDownEvent"
    >
        <div class="co-re_box-body">
            <slot></slot>
        </div>
        <i
            class="co-re_box-move"
            data-movetype="move"
        ></i>
        <template v-if="openTrick">
            <i
                class="co-re_box-trick"
                v-for="i in trickList"
                :key="i"
                :class="`co-re_box-trick-${i}`"
                :data-movetype="i"
            ></i>
        </template>
    </div>
</template>

<script>
// event : resizing dragging resized
import { uId } from '../../tools';
export default {
    name: "CoReBox",
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
        getSizeFunc: Function
    },
    data() {
        return {
            lock: false,
            trickList: ["tr", "tc", "tl", "br", "bl", "bc", "lc", "rc"],
            location: {
                translateX: 0,
                translateY: 0
            },
            parentSize: {
                width: 0,
                height: 0
            },
            sizeData: {
                lDis: 0,
                tDis: 0
            },
            parentDis: {
                xV: 0,
                yV: 0
            },
            mouseAction: '',
            openWillChange: false,
            rePageInstance: null,
            width: 50,
            top: 0,
            left: 0,
            compId: uId()
        }
    },
    methods: {
        setDataM(data) {
            this.naaa = data;
        },
        getParentInfo() {
            const parent = this.$el.offsetParent;
            if (this.$parent) {
                if (['co-re-page', 'CoRePage'].includes(this.$parent.$options._componentTag) && this.$parent.$options.name === 'CoRePage') {
                    this.rePageInstance = this.$parent;
                }
            }
            this.parentSize = {
                width: parent.clientWidth,
                height: parent.clientHeight,
            }
            const rect = parent.getBoundingClientRect();
            // 元素在页面上的位置
            this.parentDis = {
                xV: rect.left + parent.clientLeft + window.scrollX,
                yV: rect.top + parent.clientTop + window.scrollY
            }
        },
        boxMove(event) {
            if (this.mouseAction) {
                event.preventDefault();
                // 鼠标在父元素中的位置
                if (this.mouseAction === 'move') {
                    let absDisP = {
                        xV: event.pageX,
                        yV: event.pageY,
                    }
                    this.actionMove(absDisP);
                    this.setTransfrom()
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
            const { movetype: moveType } = event.target.dataset;
            this.mouseAction = moveType;
            if(this.mouseAction === 'move'){
                this.sizeData = {
                    lDis: event.pageX - this.left,
                    tDis: event.pageY - this.top
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
                compId: this.compId
            }
        },
        actionMove(evt) {
            this.computedL(evt);
            this.computedT(evt);
        },
        computedT(evt) {
            let needT = evt.yV - this.sizeData.tDis;
            if (needT < 0) {
                needT = 0;
            } else if (needT > this.maxValue.maxTop) {
                needT = this.maxValue.maxTop;
            }
            this.top = needT;
        },
        computedL(evt) {
            let needL = evt.xV - this.sizeData.lDis;
            if (needL < 0) {
                needL = 0;
            } else if (needL > this.maxValue.maxLeft) {
                needL = this.maxValue.maxLeft
            }
            this.left = needL;
        },
        actionR(evt) {
            let needW = evt.xV - this.left;
            if (needW + this.left > this.parentSize.width) {
                needW = this.parentSize.width - this.left
            } else if (needW < this.minWidth) {
                needW = this.minWidth
            }
            this.width = needW;
            return {
                width: needW
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
            if (needH + this.top > this.parentSize.height) {
                needH = this.parentSize.height - this.top;
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
                this.$emit('resized', this.emitResizeData());
                this.mouseAction = '';
            }

        },
        addEvent() {
            document.documentElement.addEventListener('mousemove', this.boxMove);
            document.documentElement.addEventListener('mousedown', this.mouseCancel);
            document.documentElement.addEventListener('mouseup', this.mouseCancel);
        },
        clearEvent() {
            document.documentElement.removeEventListener('mousemove', this.boxMove);
            document.documentElement.removeEventListener('mousedown', this.mouseCancel);
            document.documentElement.removeEventListener('mouseup', this.mouseCancel);
        },
        setTransfrom(d) {
            this.$el.style.transform = `translate3d(${this.left}px, ${this.top}px, 0px)`;
        },
        setHeight() {
            this.$el.style.height = this.height + 'px';
        },
        setWidth() {
            this.$el.style.width = this.width + 'px';
        },
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
        maxValue() {
            return {
                maxTop: this.parentSize.height - this.height,
                maxLeft: this.parentSize.width - this.width,
            }
        },
        willChange() {
            return this.mouseAction ? 'transform' : 'auto'
        }
    },
    watch: {
        h: {
            immediate: true,
            handler(v) {
                this.height = v;
            }
        },
        l: {
            immediate: true,
            handler(v) {
                this.left = v;
            }
        },
        t: {
            immediate: true,
            handler(v) {
                this.top = v;
            }
        },
        w: {
            immediate: true,
            handler(v) {
                this.width = v;
            }
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
    transition-property: box-shadow;
    transition-duration: .2s;
    box-shadow: 0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12);
    &:focus{
        //background-color: red;
    }

    &:active{
        // transition: box-shadow 200ms cubic-bezier(0, 0, 0.2, 1);
        box-shadow: 0 5px 5px -3px rgba(0,0,0,.2), 0 8px 10px 1px rgba(0,0,0,.1), 0 3px 14px 2px rgba(0,0,0,.12);
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
.#{$prefix}-#{$name}-is-move{
    user-select: none;

}
</style>
