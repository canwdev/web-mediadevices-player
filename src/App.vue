<script setup lang="ts">
import {defineComponent, onMounted, ref, computed, shallowRef, onBeforeUnmount} from 'vue'
import {useFullscreen, useStorage} from '@vueuse/core'
import {CursorHider, snapVideoImageDownload} from './utils/index'
import TauriActions from '@/components/TauriActions.vue'
import {VideoRecorder} from '@/utils/video-recorder'

async function getEnumerateDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) {
    throw new Error('enumerateDevices() not supported.')
  } else {
    // List cameras and microphones.
    const devices = await navigator.mediaDevices.enumerateDevices()

    // devices.forEach((device) => {
    //   console.log(`${device.kind}: ${device.label} id = ${device.deviceId}`, device);
    // });

    return devices
  }
}

const isLoading = ref(false)
const isTauri = ref(!!window.__TAURI__)
const isShowControls = useStorage('ls_key_is_show_controls', false)
const deviceList = ref([])
const videoRef = ref()
const currentVideoDeviceId = useStorage('ls_key_video_device_id', '')
const currentAudioDeviceId = useStorage('ls_key_audio_device_id', '')
// save config for next time reload
const videoConfig = useStorage('ls_key_video_config', {})
const mediaStreamRef = shallowRef()

const filterDeviceList = (list, kind) => {
  return list.filter((item) => item.kind === kind && !!item.deviceId)
}

const videoDeviceList = computed(() => {
  return filterDeviceList(deviceList.value, 'videoinput')
})
const audioDeviceList = computed(() => {
  return filterDeviceList(deviceList.value, 'audioinput')
})

const updateDeviceList = async () => {
  try {
    isLoading.value = true
    deviceList.value = await getEnumerateDevices()
  } catch (e) {
    console.error(e)
    alert('Error: ' + e.message)
  } finally {
    isLoading.value = false
  }
}

const listenDeviceChange = () => {
  navigator.mediaDevices.ondevicechange = async () => {
    // console.log('ondevicechange', event)
    await updateDeviceList()
  }
}

const mouseHider = shallowRef()
const actionBarRef = shallowRef()
const rootRef = shallowRef()

onMounted(async () => {
  mouseHider.value = new CursorHider(
    '#app',
    ({el, isShow}) => {
      const actionBarEl = actionBarRef.value
      if (!isShow) {
        el.style.cursor = 'none'
        actionBarEl.classList.remove('visible')
      } else {
        el.style.cursor = ''
        actionBarEl.classList.add('visible')
      }
    },
    3000
  )

  try {
    if (currentVideoDeviceId.value || currentAudioDeviceId.value) {
      await startMediaStream()
      await updateDeviceList()
      listenDeviceChange()
      return
    }

    // catch error if this type of input device is not connected
    try {
      mediaStreamRef.value = await navigator.mediaDevices.getUserMedia({audio: true})
      stopBothVideoAndAudio()
    } catch (e) {
      console.warn('getUserMedia audio Error:', e)
    }
    try {
      mediaStreamRef.value = await navigator.mediaDevices.getUserMedia({video: true})
      stopBothVideoAndAudio()
    } catch (e) {
      console.warn('getUserMedia video Error:', e)
    }

    await updateDeviceList()

    listenDeviceChange()
  } catch (e) {
    console.error(e)
    alert('Error: ' + e.message)
  }
})

onBeforeUnmount(() => {
  if (mouseHider.value) {
    mouseHider.value.stop()
  }
  stopBothVideoAndAudio()
})

// https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
const startMediaStream = async () => {
  try {
    isLoading.value = true

    const videoId = currentVideoDeviceId.value
    const audioId = currentAudioDeviceId.value

    let vConfig

    if (videoId) {
      if (!videoConfig.value || videoConfig.value.deviceId !== videoId) {
        const vDevice = videoDeviceList.value.find((i) => {
          return i.deviceId === videoId
        })
        console.log(vDevice)

        if (vDevice) {
          const conf = vDevice.getCapabilities()
          vConfig = videoConfig.value = {
            deviceId: conf.deviceId,
            height: conf.height.max,
            width: conf.width.max,
            frameRate: conf.frameRate.max,
          }
        } else {
          vConfig = {deviceId: videoId}
        }
      } else {
        vConfig = videoConfig.value
      }
    }

    // console.log('vConfig', vConfig)

    var constraints = {
      // audio: true,
      audio: audioId
        ? {
          deviceId: audioId,
          autoGainControl: false,
          echoCancellation: false,
          noiseSuppression: false,
        }
        : false,
      // audio: {
      //   channelCount: 1,
      //   sampleRate: 16000,
      //   sampleSize: 16,
      //   volume: 1
      // },
      // video: {
      //   deviceId: videoId,
      //   width: { min: 1280, ideal: 1920, max: 2560 },
      //   height: { min: 720, ideal: 1080, max: 1440 },
      //   frameRate: { ideal: 30, max: 60 }
      // },
      video: vConfig,
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    mediaStreamRef.value = stream
    // console.log('stream', stream)
    const video = videoRef.value
    video.srcObject = stream
    video.onloadedmetadata = () => {
      video.play()
    }
  } catch (e) {
    console.error(e)
    alert('Error: ' + e.message)
  } finally {
    isLoading.value = false
  }
}

const handleStart = () => {
  stopBothVideoAndAudio()
  startMediaStream()
}

const stopBothVideoAndAudio = () => {
  const video = videoRef.value
  video.pause()
  video.srcObject = null
  const stream = mediaStreamRef.value
  if (!stream) {
    return
  }
  const tracks = stream.getTracks()
  // console.log(tracks)
  tracks.forEach((track) => {
    if (track.readyState == 'live') {
      track.stop()
    }
  })
}

const clearSelect = () => {
  stopBothVideoAndAudio()
  currentVideoDeviceId.value = ''
  currentAudioDeviceId.value = ''
  videoConfig.value = null
}

// 切换容器元素全屏
const {toggle: toggleFullScreen} = useFullscreen(rootRef)

// https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API/Using_Screen_Capture
const handleStartCaptureScreen = async () => {
  try {
    isLoading.value = true
    stopBothVideoAndAudio()
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: 'window',
      },
      audio: true,
    })
    mediaStreamRef.value = stream
    // console.log('stream', stream)
    const video = videoRef.value
    video.srcObject = stream
    video.onloadedmetadata = () => {
      video.play()
    }
  } catch (e) {
    console.error(e)
    alert('Error: ' + e.message)
  } finally {
    isLoading.value = false
  }
}

const handleScreenshot = () => {
  snapVideoImageDownload(videoRef.value)
}

let videoRecorder = ref<VideoRecorder | null>(null)
onMounted(() => {
  videoRecorder.value = new VideoRecorder(videoRef.value)
})
</script>

<template>
  <div ref="rootRef" class="web-mediadevices-player">
    <div class="loading-layer" :class="{visible: isLoading}">Loading...</div>
    <div class="action-bar-wrap">
      <div
        ref="actionBarRef"
        class="action-bar font-emoji"
        :class="{visible: !currentVideoDeviceId && !currentAudioDeviceId}"
      >
        <div class="action-bar-side">
          <label for="videoSelect">
            <span>Video:</span>
            <select title="Video" id="videoSelect" v-model="currentVideoDeviceId">
              <option v-for="item in videoDeviceList" :key="item.deviceId" :value="item.deviceId">
                {{ item.label }}
              </option>
            </select>
          </label>

          <label for="audioSelect">
            <span>Audio:</span>
            <select name="Audio" id="audioSelect" v-model="currentAudioDeviceId">
              <option v-for="item in audioDeviceList" :key="item.deviceId" :value="item.deviceId">
                {{ item.label }}
              </option>
            </select>
          </label>

          <button @click="handleStart">▶Start</button>
          <button @click="stopBothVideoAndAudio">⏹Stop</button>
          <button @click="clearSelect">🛑Reset</button>

          <label for="toggleControls" title="Toggle video element controls">
            <input
              id="toggleControls"
              type="checkbox"
              v-model="isShowControls"
              title="Show Controls"
            />
            <span>Controls</span>
          </label>

          <button @click="handleStartCaptureScreen" title="Capture Screen">🖥️Capture...</button>
          <button @click="handleScreenshot" title="Take a photo">📷Screenshot</button>

          <template v-if="videoRecorder">
            <button v-if="Boolean(videoRecorder.mediaRecorder)" @click="videoRecorder.stop()" title="Take a photo" style="
    background: #F44336;">📹Save</button>
            <button v-else @click="videoRecorder.start()" title="Record canvas" >📹Record...</button>
          </template>
        </div>

        <div class="action-bar-side right">
          <button v-if="!isTauri" @click="toggleFullScreen">📺Fullscreen</button>
          <TauriActions v-if="isTauri"/>
          <a v-else href="https://github.com/canwdev/web-mediadevices-player" target="_blank" title="Github">ℹ️</a>
        </div>
      </div>
    </div>
    <video ref="videoRef" id="videoId" autoplay playsinline :controls="isShowControls"></video>
  </div>
</template>

<style lang="scss">
.web-mediadevices-player {
  background-color: black;
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;

  .action-bar-wrap {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 10;
    height: 70px;
    user-select: none;
  }

  .action-bar {
    height: 100%;
    padding: 10px;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.53), transparent);
    visibility: hidden;
    opacity: 0;
    transition: all 0.3s;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;

    &.visible {
      visibility: visible;
      opacity: 1;
    }

    span,
    a {
      color: white;
      font-size: 12px;
    }

    select {
      width: 150px;
      line-height: 1;

      option {
        background: white;
        color: black;
      }
    }

    button, input[type='checkbox'] {
      cursor: pointer;
    }

    button,
    select {
      background: rgba(0, 0, 0, 0.6);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: 4px;
      padding: 2px 4px;
      box-sizing: border-box;
      transition: all 0.3s;
      height: 26px;
      font-size: 12px;

      &:hover {
        background: rgba(255, 255, 255, 0.5);
        transition: none;
      }
    }

    .action-bar-side {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;

      &.right {
        justify-content: flex-end;
      }

      label {
        display: flex;
        align-items: center;
        gap: 2px;
      }
    }
  }

  video {
    width: 100%;
    height: 100%;
    /* object-fit: contain; */
  }

  .loading-layer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    z-index: 20;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    visibility: hidden;
    opacity: 0;
    transition: all 0.3s;
  }

  .loading-layer.visible {
    visibility: visible;
    opacity: 1;
  }
}
</style>
