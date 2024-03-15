<script lang="ts">
import {defineComponent, ref} from 'vue'
import { window,  } from '@tauri-apps/api';
import { open } from '@tauri-apps/api/shell';
export default defineComponent({
  name: 'TauriActions',
  setup() {
    let curWin = window.getCurrent();
    const isFull = ref(false)
    function toggleFullScreen() {
      isFull.value = !isFull.value
      curWin.setFullscreen(isFull.value);
    }
    const isTop = ref(false)
    function toggleTop() {
      isTop.value = !isTop.value
      curWin.setAlwaysOnTop(isTop.value);
    }

    function goGithub() {
      open("https://github.com/canwdev/web-mediadevices-player")
    }
    return {
      toggleFullScreen,
      toggleTop,
      isFull,
      isTop,
      goGithub,
    }
  }
})
</script>

<template>
  <button @click="toggleFullScreen">Fullscreen {{ isFull ? '✕':'' }}</button>
  <button @click="toggleTop">Top {{ isTop ? '📌':'' }}</button>
  <button @click="goGithub">🔗Github</button>
</template>

