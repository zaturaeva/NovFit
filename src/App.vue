<!-- src/App.vue -->
<script setup>
import BottomNav from './components/BottomNav.vue'
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <div class="app-wrapper">
    <!-- Контент страниц будет меняться здесь -->
    <RouterView />
    
    <BottomNav v-if="route.path !== '/auth'" />
  </div>
</template>

<style scoped>
.app-wrapper {
  padding: 18px 16px 100px; /* отступ снизу для BottomNav */
  background-color: #F3F4F5;
  min-height: 100vh;
}
</style>