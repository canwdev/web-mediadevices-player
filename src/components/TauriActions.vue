<script setup lang="ts">
import {ref} from 'vue'
import {window} from '@tauri-apps/api'
import {open} from '@tauri-apps/api/shell'

let curWin = window.getCurrent()
const isFull = ref(false)
function toggleFullScreen() {
  isFull.value = !isFull.value
  curWin.setFullscreen(isFull.value)
}
const isTop = ref(false)
function toggleTop() {
  isTop.value = !isTop.value
  curWin.setAlwaysOnTop(isTop.value)
}

function goGithub() {
  open('https://github.com/canwdev/web-mediadevices-player')
}
</script>

<template>
  <button class="themed-button" @click="toggleFullScreen">
    Fullscreen {{ isFull ? '✕' : '' }}
  </button>
  <button class="themed-button" @click="toggleTop" title="Pin window top">
    Top {{ isTop ? '📌' : '' }}
  </button>
  <button class="themed-button" @click="goGithub" title="Github">ℹ️</button>
</template>
