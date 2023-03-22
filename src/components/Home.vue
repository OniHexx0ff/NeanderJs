
<template>
    <Navbar />
    <div class="container">
        <Neander />
    </div>
</template>

<script setup>
 import Neander from './Neander.vue';
 import Navbar from './Navbar.vue'
</script>

<style scoped>

.container{
    height: fit-content;
}
</style>
