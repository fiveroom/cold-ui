<script>
export default {
    name: "test",
    render(createElement, context) {
        const defaultSlots = this.$slots.default.filter(i => i.componentOptions.tag === "test-child");
        console.log(defaultSlots[0].componentOptions.tag);
        return (<div>
            {this.$slots.default}
        </div>)
    }
}
</script>

<style scoped>

</style>
