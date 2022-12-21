<template>
    <div>
       test-two {{ propName }}
    </div>
</template>

<script>
export default {
    name: "test-child",
    props: {
        propName: {
            type: Number,
            default: 0
        },
    },
}
</script>

<style scoped>

</style>
