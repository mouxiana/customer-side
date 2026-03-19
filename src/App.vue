<template>
  <div class="app-shell min-h-screen bg-gray-50">
    <Navbar />
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import Navbar from './components/Navbar.vue'

const FONT_SCALE_KEY = 'ui_font_scale'

onMounted(() => {
  const savedScale = localStorage.getItem(FONT_SCALE_KEY) || '1'
  document.documentElement.style.setProperty('--app-font-scale', String(savedScale))
})
</script>
