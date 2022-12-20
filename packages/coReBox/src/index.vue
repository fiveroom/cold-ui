<template>
    <div
        class="co-re_box-home"
        ref="coreBox"
        :class="{
            'co-re_box-home-is-move': !!mouseAction,
            'co-re_box-home-check': boxActive,
            'co-re_box-home-active': !lock,
            'co-re_box-home-animal': !disableAnimal && !mouseAction && !useKey && openAnimal
        }"
        tabindex="0"
        :style="{ 'z-index': this.zIndex, 'outline-color': tipsColorIns}"
        @transitionend="transitionendBox"
    >
        <div class="co-re_box-body" ref="bodyEL">
            <slot></slot>
        </div>
        <i
            class="co-re_box-move"
            :style="{
                height: moveBoxHeight
            }"
            v-show="!lock"
            @mousedown="mouseMoveCall($event)"
            v-if="!moveSelector"
            ref="boxMove"
        ></i>
        <template v-if="!lock">
            <i
                class="co-re_box-trick"
                v-for="i in trickArr"
                :key="i"
                :class="[`co-re_box-trick-${i}`, trickClass(i)]"
                :style="{ 'border-color': tipsColorIns}"
                :data-movetype="i"
                @mousedown="mouseDownEvent($event, i)"
            >
                <i v-if="i.includes('c')" class="co-re_box-trick--line" :style="{'background-color': tipsColorIns}"></i>
            </i>
        </template>
    </div>
</template>

<script>

import {uId, numToFixed, verifyColor} from '../../tools';
import {debounce} from "lodash-es";

const MOVE_HANDLER = ["tr", "tc", "tl", "br", "bl", "bc", "lc", "rc"];

export default {
    name: "coReBox",
    props: {
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
            default: 20
        },
        minHeight: {
            type: Number,
            default: 20
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
        getSizeFunc: Function,
        parentSize: {
            type: Object,
            default: null
        },
        lock: {
            type: Boolean,
            default: false
        },
        moveBoxHeight: {
            type: String,
            default: '100%'
        },
        trickList: {
            default: () => (["tr", "tc", "tl", "br", "bl", "bc", "lc", "rc", "cm"]),
            validator(val) {
                let arr = ["tr", "tc", "tl", "br", "bl", "bc", "lc", "rc", "cm"];
                return val.every(i => arr.includes(i))
            }
        },
        tipsColor: {
            type: String,
            default: '#007fd4'
        },
        // 元素放入的位置
        sourceEle: {
            type: [String, HTMLElement],
            default: ''
        },
        moveSelector: {
            type: String,
            default: ''
        },
        disableAnimal: {
            type: Boolean,
            default: false
        },
        allowScroll: {
            type: Boolean,
            default: false
        },
        parentElement: [String, HTMLElement]
    },
    data() {
        return {
            useKey: false,
            openAnimal: false,
            location: {
                translateX: 0,
                translateY: 0
            },
            sizeData: {
                lDis: 0,
                tDis: 0,
                oldTop: 0,
                oldLeft: 0,
                oldHeight: 0,
                oldWidth: 0
            },
            parentBoxSize: {
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
            reloadDe: debounce(this.reload, 40),
            lastMouse: null,
            parentEle: null,
            inCoRePage: false,
            resizeObserver: null
        }
    },
    methods: {
        trickClass(val) {
            return !!this.mouseAction ? (this.mouseAction === val ? 'co-re_box-trick--active' : '') : ''
        },
        boxMove(event) {
            if (this.mouseAction && !this.lock) {
                event.preventDefault();
                // 鼠标在父元素中的位置
                if (this.mouseAction === 'move') {
                    this.actionMove(event.pageX - this.sizeData.lDis, event.pageY - this.sizeData.tDis);
                    this.setParentScroll(event);
                } else {
                    const resizeRecord = {};
                    if (this.mouseAction.includes('b')) {
                        Object.assign(resizeRecord, this.actionB(event.pageY - this.sizeData.tDis));
                        this.setParentScrollTop(false);
                    } else if (this.mouseAction.includes('t')) {
                        Object.assign(resizeRecord, this.actionT(event.pageY - this.sizeData.tDis));
                        this.setParentScrollTop(true);
                    }
                    if (this.mouseAction.includes('l')) {
                        Object.assign(resizeRecord, this.actionL(event.pageX - this.sizeData.lDis))
                    } else if (this.mouseAction.includes('r')) {
                        Object.assign(resizeRecord, this.actionR(event.pageX - this.sizeData.lDis))
                    }
                    this.setResize(resizeRecord);
                }
                this.$emit('resizing', this.emitResizeData('mouse'));
            }
        },
        /**
         *
         * @param event {MouseEvent}
         */
        setParentScroll(event) {
            if (this.allowScroll) {
                const dir = event.pageY - this.lastMouse.pageY;
                if (dir > 0) {
                    this.setParentScrollTop(false);
                } else if (dir < 0) {
                    this.setParentScrollTop(true);
                }
                this.lastMouse = event;
            }
        },
        setParentScrollTop(top) {
            if (this.allowScroll) {
                const {scrollTop} = this.parentEle;
                if (top) {
                    if (this.top < scrollTop) {
                        this.$el.parentElement.scrollTop = this.top;
                    } else if (this.top > scrollTop + this.parentDis.height) {
                        this.$el.parentElement.scrollTop = this.top - this.parentDis.height;
                    }
                } else {
                    if (this.top + this.height > scrollTop + this.parentDis.height) {
                        this.$el.parentElement.scrollTop = this.top + this.height - this.parentDis.height;
                    } else if (this.top + this.height < scrollTop) {
                        this.$el.parentElement.scrollTop = this.top + this.height;
                    }
                }
            }
        },
        setResize(location) {
            if (Reflect.has(location, 'top') || Reflect.has(location, 'left')) {
                this.setTransform()
            }
            if (Reflect.has(location, 'width')) {
                this.setWidth()
            }
            if (Reflect.has(location, 'height')) {
                this.setHeight()
            }
        },
        mouseDownEvent(event, type) {
            if (this.lock || event.button !== 0) return
            this.mouseAction = type;
            if (this.mouseAction) {
                event.stopPropagation();
                this.setBoxActive();
                this.lastMouse = event;
                // 记录尺寸和位置大小
                this.sizeData = {
                    lDis: event.pageX,
                    tDis: event.pageY,
                    oldLeft: this.left,
                    oldTop: this.top,
                    oldHeight: this.height,
                    oldWidth: this.width,
                };
                window.addEventListener('mousemove', this.boxMove);
                window.addEventListener('mouseup', this.mouseCancel);
            }
        },
        emitResizeData(eventType) {
            return {
                rect: {
                    h: this.height,
                    w: this.width,
                    l: this.left,
                    t: this.top
                },
                boxId: this.boxId,
                compId: this.compId,
                type: this.mouseAction,
                eventType
            }
        },
        actionMove(left, top) {
            this.left = this.verifyLeft(left + this.sizeData.oldLeft);
            this.top = this.verifyTop(top + this.sizeData.oldTop);
            this.setTransform();
        },
        actionMoveByStep(step, topStu) {
            if (this.lock) return;
            if (topStu) {
                this.top = this.verifyTop(this.top + step);
            } else {
                this.left = this.verifyLeft(this.left + step);
            }
            this.setTransform();
            this.$emit('resizing', this.emitResizeData('keyboard'));
            return {
                boxId: this.boxId,
                left: this.left,
                top: this.top
            }
        },
        verifyLeft(needL) {
            if (needL < 0) {
                needL = 0;
            } else if (needL > this.maxValue.maxLeft) {
                needL = this.maxValue.maxLeft
            }
            return numToFixed(needL)
        },
        verifyTop(needT) {
            if (needT < 0) {
                needT = 0;
            } else if (!this.allowScroll && needT > this.maxValue.maxTop) {
                needT = this.maxValue.maxTop;
            }
            return numToFixed(needT)
        },
        actionR(val) {
            let needW = this.sizeData.oldWidth + val;
            if (needW + this.left > this.parentDis.width) {
                needW = this.parentDis.width - this.left
            } else if (needW < this.minWidth) {
                needW = this.minWidth
            }
            this.width = numToFixed(needW);
            return {
                width: this.width
            }
        },
        setActive(val) {
            this.boxActive = val;
        },
        actionL(val) {
            let needW = this.sizeData.oldWidth - val;
            let needL = this.sizeData.oldLeft + val;
            if (needL < 0) {
                needL = 0;
                needW = this.left + this.width;
            }
            if (needW < this.minWidth) {
                needL = this.left + this.width - this.minWidth;
                needW = this.minWidth;
            }
            this.width = numToFixed(needW);
            this.left = numToFixed(needL);
            return {
                width: this.width,
                left: this.left,
            }
        },
        actionT(val) {
            let needH = this.sizeData.oldHeight - val;
            let needT = this.sizeData.oldTop + val;
            if (needT < 0) {
                needT = 0;
                needH = this.top + this.height;
            }
            if (needH < this.minHeight) {
                needH = this.minHeight;
                needT = this.top + this.height - this.minHeight;
            }
            this.height = numToFixed(needH);
            this.top = numToFixed(needT);
            return {
                height: this.height,
                top: this.top
            }
        },
        actionB(val) {
            let needH = this.sizeData.oldHeight + val;
            if (!this.allowScroll && needH + this.top > this.parentDis.height) {
                needH = this.parentDis.height - this.top;
            } else if (needH < this.minHeight) {
                needH = this.minHeight;
            }
            this.height = numToFixed(needH);
            return {
                height: this.height
            }
        },
        mouseCancel() {
            if (this.mouseAction && !this.lock) {
                this.mouseAction = '';
                this.$emit('update:w', this.width);
                this.$emit('update:h', this.height);
                this.$emit('update:l', this.left);
                this.$emit('update:t', this.top);
                this.$emit('resized', this.emitResizeData('mouse'));
                window.removeEventListener('mousemove', this.boxMove);
                window.removeEventListener('mouseup', this.mouseCancel);
            }
        },
        // 1、盒子锁定立即执行。2、监听document点击
        mouseDownOther() {
            if (!this.lock) {
                this.setBoxUnActive();
            }
        },
        setBoxUnActive() {
            if (this.boxActive) {
                this.boxActive = false;
                this.$emit('uncheck-box', this.ids)
            }
        },
        setBoxActive() {
            if (!this.boxActive) {
                this.boxActive = true;
                this.$emit('check-box', this.ids);
            }
        },
        setTransform() {
            this.$el.style.setProperty('transform', `translate(${this.left}px, ${this.top}px)`);
        },
        setHeight() {
            this.$el.style.setProperty('height', this.height + 'px');
        },
        setWidth() {
            this.$el.style.setProperty('width', this.width + 'px');
        },
        setOpacity() {
            this.$el.style.setProperty("opacity", '1');
        },
        reload() {
            this.openAnimal = true;
            this.setOpacity();
            this.setTransform();
            this.setHeight();
            this.setWidth();
        },
        setMoveEvent() {
            if (this.moveSelector) {
                const element = this.$refs.bodyEL.querySelector(this.moveSelector);
                if (element) {
                    element.addEventListener('mousedown', event => this.mouseMoveCall(event));
                }
            }
        },
        mouseMoveCall(event) {
            if (this.moveHand) {
                event.stopPropagation();
                this.mouseDownEvent(event, 'move')
            }
        },
        transitionendBox() {
            this.openAnimal = false;
        },
        setParentElement() {
            if (this.$parent && this.$parent.$options && this.$parent.$options.name === 'coRePage') {
                this.parentEle = this.$parent.$el;
                this.inCoRePage = true;
            } else if (Object.prototype.toString.call(this.parentElement) === '[object String]') {
                this.parentEle = document.querySelector(this.parentElement);
            } else if (this.parentElement instanceof HTMLElement) {
                this.parentEle = this.parentElement;
            } else {
                this.parentEle = this.$el.offsetParent;
            }
        },
        injectSourceElement() {
            if (this.sourceEle && !this.inCoRePage) {
                let ele = null;
                if (Object.prototype.toString.call(this.sourceEle) === "[object String]") {
                    ele = document.querySelector(this.sourceEle);
                } else if (this.sourceEle instanceof HTMLElement) {
                    ele = this.sourceEle;
                }
                if (ele) {
                    ele.appendChild(this.$el)
                    this.parentEle = ele;
                }
            }
        },
        addEvent() {
            window.addEventListener('mousedown', this.mouseDownOther);
            this.setParentSizeListen();
        },
        clearEvent() {
            window.removeEventListener('mousedown', this.mouseDownOther);
            this.resizeObserver && this.resizeObserver.disconnect()
        },
        setParentSizeListen() {
            if (!this.inCoRePage) {
                this.resizeObserver = new ResizeObserver((entries) => {
                    this.parentBoxSize = entries[0].contentRect
                })
                this.resizeObserver.observe(this.parentEle);
            }
        }
    },
    created() {
    },
    mounted() {
        this.setParentElement();
        this.injectSourceElement();
        this.setMoveEvent()
        this.addEvent();
    },
    beforeDestroy() {
        this.clearEvent();
        this.reloadDe.cancel();
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
        ids() {
            return {
                boxId: this.boxId,
                compId: this.compId,
            }
        },
        tipsColorIns() {
            return verifyColor(this.tipsColor.toString(), '#007fd4')
        },
        parentDis() {
            if (this.inCoRePage) {
                return this.$parent.boxRect
            }
            return this.parentBoxSize
        },
        moveHand() {
            return this.trickList.includes('cm')
        },
        trickArr() {
            return this.trickList.filter(i => MOVE_HANDLER.includes(i));
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
        },
        lock: {
            immediate: true,
            handler(v) {
                if (v) {
                    this.setBoxUnActive();
                }
            }
        }
    }
}
</script>

<style scoped lang="scss">
@import "../../global.variate";
@import "../../global.style";

$name: 're_box';

$trick-width: 10px;
$trick-corner-width: 6px;
$trick-padding: 8px;
$trick-out: -1px;
$trick-box-out: - $trick-width / 2;
$trick-show-size: 2px;
$trick-split: 8px;
$trick-border: $trick-show-size solid $trick-color;
.#{$prefix}-#{$name}-home {
    position: absolute;
    z-index: 0;
    will-change: auto;
    top: 0;
    left: 0;
    transform-origin: 0 0;
    transition-property: box-shadow;
    transition-duration: .2s;
    opacity: 0;
    box-shadow: 0 3px 1px -2px rgba(0, 0, 0, .2),
    0 2px 2px 0 rgba(0, 0, 0, .14),
    0 1px 5px 0 rgba(0, 0, 0, .12);

    &-active {
        &:active {
            box-shadow: 0 5px 5px -3px rgba(0, 0, 0, .2), 0 8px 10px 1px rgba(0, 0, 0, .1), 0 3px 14px 2px rgba(0, 0, 0, .12);
        }

        &:focus {
            outline: 1px dashed $trick-color;
        }
    }

    &-animal {
        transition-property: transform, width, height, opacity;
        transition-duration: .45s;
        transition-timing-function: ease-out;
    }

    &-check {
        outline: 1px dashed $trick-color;
    }

    &-is-move {
        user-select: none;
        will-change: transform;
    }
}

.#{$prefix}-#{$name}-trick {
    position: absolute;
    display: block;
    font-size: 1px;
    z-index: 2;

    &--line {
        content: "";
        display: block;
        background-color: $trick-color;
        border-radius: 2px;
        transition-property: opacity;
        transition-timing-function: ease-in;
        transition-duration: .15s;
        opacity: 0;
    }

    &-tc, &-bc, &-lc, &-rc {
        display: flex;

        &:hover > .#{$prefix}-#{$name}-trick--line {
            opacity: 1;
            //transition-property: opacity;
            transition-duration: .25s;
            transition-timing-function: ease-out;
        }
    }

    &-tc {
        top: $trick-box-out;
    }

    &-bc {
        bottom: $trick-box-out;
    }

    &-bc, &-tc {
        align-items: center;
        justify-content: center;
        cursor: n-resize;
        left: $trick-corner-width + $trick-split;
        height: $trick-width;
        right: $trick-corner-width + $trick-split;

        & > .#{$prefix}-#{$name}-trick--line {
            transform-origin: bottom;
            width: 100%;
            height: $trick-show-size;
        }

        &.co-re_box-trick--active > .#{$prefix}-#{$name}-trick--line {
            opacity: 1;
        }
    }

    &-lc {
        left: $trick-box-out;
    }

    &-rc {
        right: $trick-box-out;

    }

    &-lc, &-rc {
        justify-content: center;
        align-items: center;
        cursor: e-resize;
        top: $trick-corner-width + $trick-split;
        bottom: $trick-corner-width + $trick-split;
        width: $trick-width;

        & > .#{$prefix}-#{$name}-trick--line {
            transform-origin: left;
            height: 100%;
            width: $trick-show-size;
        }

        &.co-re_box-trick--active > .#{$prefix}-#{$name}-trick--line {
            opacity: 1;
        }
    }

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

    &-bl, &-tr, &-br, &-tl {
        opacity: 0;
        width: $trick-corner-width + $trick-show-size + $trick-out;
        height: $trick-corner-width + $trick-show-size + $trick-out;

        &:hover {
            opacity: 1;
            transition: opacity .25s ease-out;
        }

        transition: opacity .25s ease-in;

        &.co-re_box-trick--active {
            opacity: 1;
        }
    }

    &-bl,
    &-tr {
        cursor: nesw-resize;
    }

    &-br,
    &-tl {
        cursor: nwse-resize;
    }
}

.#{$prefix}-#{$name}-move {
    position: absolute;
    display: block;
    top: 0;
    width: 100%;
    left: 0;
    background-color: transparent;
    z-index: 1;
    min-height: 30px;
    cursor: move;
}

.#{$prefix}-#{$name}-body {
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 0;
}

</style>
