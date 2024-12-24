<script setup lang="ts">
import {ref} from 'vue'
import {window} from '@tauri-apps/api'
import {uniOpenUrl} from '@/utils'

let curWin = window.getCurrent()
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
    <span v-if="!isFullscreen" class="mdi mdi-fullscreen"></span>
    <span v-else class="mdi mdi-fullscreen-exit"></span>
  </button>
  <button
    class="btn-no-style"
    :class="[isTop ? 'active' : '']"
    @click="toggleTop"
    title="Pin window top"
  >
    {{ isTop ? '📌' : '🔝' }}
  </button>
</template>
