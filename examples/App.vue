<template>
    <div id="app">
        <ResizeBox></ResizeBox>
        <ResizeBox style="background-color: red"></ResizeBox>
        <x-button>
          hello
        </x-button>
    </div>
</template>

<script>

export default {
    name: 'App',
    components: {
    }
}
</script>

<style lang="scss">
#app{
    height: 80vh;
    width: 80vh;
    margin: 100px auto;
    border: 1px solid red;
}
</style>
