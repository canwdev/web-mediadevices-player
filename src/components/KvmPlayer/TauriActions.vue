<script setup lang="ts">
import { window } from '@tauri-apps/api'
import { ref } from 'vue'

const curWin = window.getCurrent()
const isFullscreen = ref(false)
function toggleFullScreen() {
  isFullscreen.value = !isFullscreen.value
  curWin.setFullscreen(isFullscreen.value)
}
const isTop = ref(false)
function toggleTop() {
  isTop.value = !isTop.value
  curWin.setAlwaysOnTop(isTop.value)
}
</script>

<template>
  <button class="btn-no-style" @click="toggleFullScreen">
    <span v-if="!isFullscreen" class="mdi mdi-fullscreen" />
    <span v-else class="mdi mdi-fullscreen-exit" />
  </button>
  <button
    class="btn-no-style"
    :class="[isTop ? 'active' : '']"
    title="Pin window top"
    @click="toggleTop"
  >
    {{ isTop ? '📌' : '🔝' }}
  </button>
</template>
