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
  <button class="themed-button" @click="toggleFullScreen">
    {{ isFullscreen ? '╳' : '⛶' }}
  </button>
  <button
    class="themed-button"
    :class="[isTop ? 'blue' : '']"
    @click="toggleTop"
    title="Pin window top"
  >
    {{ isTop ? '📌' : '🔝' }}
  </button>
</template>
