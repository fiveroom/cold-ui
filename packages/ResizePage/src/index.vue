<template>
    <div class="co-re_page-home">
        <slot></slot>
        <div
            class="co-re_page-stand co-re_page-stand-x"
            v-show="xStand.display"
            :style="{}"
        ></div>
        <div
            class="co-re_page-stand co-re_page-stand-y"
            v-show="yStand.display"
            :style="{}"
        ></div>
    </div>
</template>

<script>
import ResizeBox from "../../ResizeBox/src";
import {numToFixed} from "../../tools";

export default {
    name: "CoRePage",
    props: {
        boxArr: {
            type: Array,
            default: () => ([])
        }
    },
    data(){
      return {
          xStand: {
              top: 0,
              display: true,
          },
          yStand: {
              left: 0,
              display: true,
          },
          alignDis: 4,
          box: {
              width: 0,
              height: 0,
              centerW: 0,
              centerH: 0
          },
          leftChange: 'no',
          topChange: 'no',
      }
    },
    updated() {
    },
    watch: {
        boxArr(nV){
            console.log('nv :>> ', nV);
        }
    },
    computed: {
        xStandStyle(){

        }
    },
    mounted() {

    },
    comments: {
        ResizeBox
    },
    methods:{
        initData(){
            let rect = this.$el.getBoundingClientRect();
            this.box.height = rect.height;
            this.box.width = rect.width;
            this.box.centerW = rect.width / 2;
            this.box.centerH = rect.height / 2;
        },
        resizeEvent(rect){
            this.pagePost(rect)
        },
        pagePost(newRect) {
            let disW = newRect.w / 2 + newRect.l;
            let disH = newRect.h / 2 + newRect.t;
            if (
                Math.abs(disW - this.box.centerH) < this.alignDis &&
                Math.abs(disW - this.box.centerH) !== 0
            ) {
                this.leftChange = this.box.centerH - newRect.w / 2;
                this.yStand.left = "50%";
                this.yStand.display = true;
            } else if (
                Math.abs(newRect.l - this.box.centerH) < this.alignDis &&
                Math.abs(newRect.l - this.box.centerH) !== 0
            ) {
                this.leftChange = this.box.centerH;
                this.yStand.left = "50%";
                this.yStand.display = true;
            } else if (
                Math.abs(newRect.l + newRect.w - this.box.centerH) < this.alignDis &&
                Math.abs(newRect.l + newRect.w - this.box.centerH) !== 0
            ) {
                this.leftChange = this.box.centerH - newRect.w;
                this.yStand.left = "50%";
                this.yStand.display = true;
            } else {
                this.leftChange = "no";
                this.yStand.display = false;
            }
            if (
                Math.abs(disH - this.box.centerH) < this.alignDis &&
                Math.abs(disH - this.box.centerH) !== 0
            ) {
                this.xStand.top = "50%";
                this.topChange = this.box.centerH - newRect.h / 2;
                this.xStand.display = true;
            } else if (
                Math.abs(newRect.t - this.box.centerH) < this.alignDis &&
                Math.abs(newRect.t - this.box.centerH) !== 0
            ) {
                this.xStand.top = "50%";
                this.topChange = this.box.centerH;
                this.xStand.display = true;
            } else if (
                Math.abs(newRect.t + newRect.h - this.box.centerH) < this.alignDis &&
                Math.abs(newRect.t + newRect.h - this.box.centerH) !== 0
            ) {
                this.xStand.top = "50%";
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
            this.boxArr.filter(i => i.moduleId !== moduleId).forEach((it) => {
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
                if (leftObjCenEle && leftCenDis < this.alignDis && leftCenDis != 0) {
                    this.yStand.left =
                        leftObjCenEle.l + leftObjCenEle.w / 2 + "px";
                    this.leftChange =
                        leftObjCenEle.l +
                        leftObjCenEle.w / 2 -
                        newRect.w / 2;
                    this.yStand.display = true;
                } else if (leftObjEle && leftDis < this.alignDis && leftDis !== 0) {
                    this.leftChange = leftObjEle.l;
                    this.yStand.left = this.leftChange + "px";
                    this.yStand.display = true;
                } else if (rLEle && rLEleDis < this.alignDis && rLEleDis !== 0) {
                    this.leftChange = rLEle.l - newRect.w;
                    this.yStand.left = rLEle.l + "px";
                    this.yStand.display = true;
                } else if (lREle && lREleDis < this.alignDis && lREleDis !== 0) {
                    this.leftChange = lREle.l + lREle.w;
                    this.yStand.left = this.leftChange + "px";
                    this.yStand.display = true;
                } else if (rightObjEle && rightDis < this.alignDis && rightDis !== 0) {
                    this.leftChange =
                        rightObjEle.l + rightObjEle.w - newRect.w;
                    this.yStand.left =
                        rightObjEle.l + rightObjEle.w + "px";
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
                        topObjCenEle.t + topObjCenEle.h / 2 + "px";
                    this.topChange =
                        topObjCenEle.t +
                        topObjCenEle.h / 2 -
                        newRect.h / 2;
                    this.xStand.display = true;
                } else if (tbEle && tbEleDis < this.alignDis && tbEleDis !== 0) {
                    this.topChange = tbEle.t + tbEle.h;
                    this.xStand.top = this.topChange + "px";
                    this.xStand.display = true;
                } else if (topObjEle && topDis < this.alignDis && topDis !== 0) {
                    this.topChange = topObjEle.t;
                    this.xStand.top = this.topChange + "px";
                    this.xStand.display = true;
                } else if (bTEle && bTEleDis < this.alignDis && bTEleDis !== 0) {
                    this.topChange = bTEle.t - newRect.h;
                    this.xStand.top = bTEle.t + "px";
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
                        bottomObjCenEle.t + bottomObjCenEle.h + "px";
                    this.xStand.display = true;
                } else {
                    this.topChange = "no";
                    this.xStand.display = false;
                }
            }
        },
        findMin(arr){
            arr.sort((a, b) => a.dis - b.dis);
            return (arr[0] && arr[0].obj) || null;
        }
    }
}
</script>

<style scoped lang="scss">
@import "../../global.scss";
$name: 're_page';

.#{$prefix}-#{$name}-home{
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 0;
}

.#{$prefix}-#{$name}-stand {
    position: absolute;
    z-index: 99;
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
