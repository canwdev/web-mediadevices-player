<script>
import {defineComponent, onMounted, ref, computed, shallowRef, onBeforeUnmount} from 'vue'
import {
  useLocalStorageBoolean,
  useLocalStorageString,
  useLocalStorageObject,
} from '@/hooks/use-local-storage'
import {CursorHider, snapVideoImageDownload} from './utils/index'

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

export default defineComponent({
  setup() {
    const isLoading = ref(false)
    const isTauri = ref(!!window.__TAURI__)
    const isShowControls = useLocalStorageBoolean('ls_key_is_show_controls', false)
    const deviceList = ref([])
    const videoRef = ref()
    const currentVideoDeviceId = useLocalStorageString('ls_key_video_device_id', '')
    const currentAudioDeviceId = useLocalStorageString('ls_key_audio_device_id', '')
    // save config for next time reload
    const videoConfig = useLocalStorageObject('ls_key_video_config')
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

        let vConfig = false

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

    // 切换容器元素全屏（如有）
    function toggleParentFullScreen(flag = false) {
      const containerEl = rootRef.value.closest('.vp-window')
      if (!containerEl) {
        return
      }
      if (flag) {
        containerEl.classList.add('_fullscreen_content')
      } else {
        containerEl.classList.remove('_fullscreen_content')
      }
    }

    function toggleFullScreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
        toggleParentFullScreen(true)
      } else if (document.exitFullscreen) {
        document.exitFullscreen()
        toggleParentFullScreen(false)
      }
    }

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

    return {
      videoRef,
      deviceList,
      currentVideoDeviceId,
      videoDeviceList,
      currentAudioDeviceId,
      audioDeviceList,
      handleStart,
      stopBothVideoAndAudio,
      clearSelect,
      isLoading,
      isShowControls,
      toggleFullScreen,
      handleStartCaptureScreen,
      handleScreenshot,
      actionBarRef,
      rootRef,
      isTauri,
    }
  },
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
          <button v-if="!isTauri" @click="toggleFullScreen">📺Fullscreen</button>

          <label for="toggleControls">
            <input
              id="toggleControls"
              type="checkbox"
              v-model="isShowControls"
              title="Show Controls"
            />
            <span>Controls</span>
          </label>

          <button @click="handleStartCaptureScreen">⏺Capture...</button>
          <button @click="handleScreenshot">📷Screenshot</button>
        </div>

        <div>
          <a href="https://github.com/canwdev/web-mediadevices-player" target="_blank">🔗Github</a>
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
