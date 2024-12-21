<script lang="ts">
export default {
  name: 'KvmPlayer',
}
</script>

<script setup lang="ts">
import {onMounted, ref, computed, shallowRef, onBeforeUnmount, watch} from 'vue'
import {useFullscreen, usePermission, useStorage} from '@vueuse/core'
import {downloadUrl, snapVideoImage} from './utils/index'
import TauriActions from '@/components/KvmPlayer/TauriActions.vue'
import {VideoRecorder} from './utils/video-recorder'
import {type IVideoConfig, useSettingsStore} from '@/stores/settings'
import SettingsPrompt from '@/components/KvmPlayer/SettingsPrompt.vue'
import KvmInput from '@/components/KvmPlayer/KvmInput.vue'
import {CursorHider} from '@/components/KvmPlayer/utils/cursor-hider'
import moment from 'moment/moment'
import QRScanner from '@/components/KvmPlayer/QRScanner.vue'

const getEnumerateDevices = async () => {
  if (!navigator.mediaDevices?.enumerateDevices) {
    throw new Error('enumerateDevices() not supported.')
  } else {
    // List cameras and microphones.
    const devices: MediaDeviceInfo[] = await navigator.mediaDevices.enumerateDevices()

    // devices.forEach((device) => {
    //   console.log(`${device.kind}: ${device.label} id = ${device.deviceId}`, device)
    // })

    return devices
  }
}

const settingsStore = useSettingsStore()

const loadingText = ref('')
const isTauri = ref(!!window.__TAURI__)
const deviceList = ref<MediaDeviceInfo[]>([])
const videoRef = ref()

const mediaStreamRef = shallowRef<MediaStream>()

const isStreaming = computed(() => {
  return Boolean(mediaStreamRef.value)
})

const filterDeviceList = (list: MediaDeviceInfo[], kind: string) => {
  return list.filter((item) => item.kind === kind && !!item.deviceId)
}

const videoDeviceList = computed(() => {
  return [{label: '---', deviceId: ''}, ...filterDeviceList(deviceList.value, 'videoinput')]
})
const audioDeviceList = computed(() => {
  return [{label: '---', deviceId: ''}, ...filterDeviceList(deviceList.value, 'audioinput')]
})

const updateDeviceList = async () => {
  try {
    loadingText.value = 'Updating Device List...'
    // console.log('updateDeviceList1')
    deviceList.value = await getEnumerateDevices()
    // console.log('updateDeviceList2')
  } catch (error: any) {
    console.error(error)
    window.$notification({
      type: 'error',
      message: error.message,
      timeout: 5000,
    })
  } finally {
    loadingText.value = ''
  }
}

const listenDeviceChange = () => {
  // console.log('[listenDeviceChange]')
  navigator.mediaDevices.ondevicechange = async () => {
    // console.log('[ondevicechange]', event)
    await updateDeviceList()
  }
}

const mouseHider = shallowRef()
const actionBarRef = shallowRef()
const rootRef = shallowRef()

watch(
  () => settingsStore.autoHideUI,
  (val) => {
    if (mouseHider.value) {
      if (val) {
        mouseHider.value.start()
      } else {
        mouseHider.value.stop()
      }
    }
  },
)

const permissionCamera = usePermission('camera')
const permissionMicrophone = usePermission('microphone')

const initDevices = async () => {
  try {
    loadingText.value = 'Initializing devices...'
    if (settingsStore.currentVideoDeviceId || settingsStore.currentAudioDeviceId) {
      await startMediaStream()
      await updateDeviceList()
      listenDeviceChange()
      return
    }

    // catch error if this type of input device is not connected
    try {
      mediaStreamRef.value = await navigator.mediaDevices.getUserMedia({audio: true})
      stopMediaStreaming()
    } catch (e) {
      console.warn('getUserMedia audio Error:', e)
    }
    try {
      mediaStreamRef.value = await navigator.mediaDevices.getUserMedia({video: true})
      stopMediaStreaming()
    } catch (e) {
      console.warn('getUserMedia video Error:', e)
    }

    await updateDeviceList()

    listenDeviceChange()
  } catch (error: any) {
    console.error(error)
    window.$notification({
      type: 'error',
      message: error.message,
      timeout: 5000,
    })
  } finally {
    loadingText.value = ''
  }
}

onMounted(async () => {
  await initDevices()
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
    3000,
  )
  if (!settingsStore.autoHideUI) {
    mouseHider.value.stop()
  }
})

onBeforeUnmount(() => {
  if (mouseHider.value) {
    mouseHider.value.stop()
  }
  stopMediaStreaming()
})

/**
 * 开启媒体设备视频流
 * https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
 */
const startMediaStream = async () => {
  try {
    loadingText.value = 'Starting MediaStream...'

    const videoId = settingsStore.currentVideoDeviceId
    const audioId = settingsStore.currentAudioDeviceId

    if (!videoId) {
      return
    }

    let vConfig: IVideoConfig | undefined = undefined

    if (videoId) {
      // 如果保存的id不匹配，则重新获取配置
      if (!settingsStore.videoConfig || settingsStore.videoConfig.deviceId !== videoId) {
        const vDevice = videoDeviceList.value.find((device) => {
          return device.deviceId === videoId
        })
        console.log('vDevice', vDevice)

        if (vDevice) {
          // @ts-ignore
          const conf = vDevice.getCapabilities()
          settingsStore.videoConfig = {
            deviceId: conf.deviceId,
            height: conf.height.max,
            width: conf.width.max,
            frameRate: conf.frameRate.max,
          }
          vConfig = settingsStore.videoConfig
        } else {
          vConfig = {deviceId: videoId}
        }
      } else {
        vConfig = settingsStore.videoConfig
      }
    }

    console.log('vConfig', vConfig)

    const constraints = {
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
    console.log('stream', stream)
    const video = videoRef.value
    video.srcObject = stream
    video.onloadedmetadata = () => {
      video.play()
    }
  } catch (error: any) {
    console.error(error)
    window.$notification({
      type: 'error',
      message: error.message,
      timeout: 5000,
    })
  } finally {
    loadingText.value = ''
  }
}

const handleStartStreaming = () => {
  stopMediaStreaming()
  setTimeout(() => {
    startMediaStream()
  })
}

/**
 * 停止视频/音频流
 */
const stopMediaStreaming = () => {
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
  mediaStreamRef.value = undefined
}

/**
 * 停止并清除选择的设备
 */
const clearSelect = () => {
  stopMediaStreaming()
  settingsStore.currentVideoDeviceId = ''
  settingsStore.currentAudioDeviceId = ''
  settingsStore.videoConfig = null
}

// 切换容器元素全屏
const {toggle: toggleFullScreen, isFullscreen} = useFullscreen(rootRef)

/**
 * 开启屏幕投影
 * https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API/Using_Screen_Capture
 */
const handleStartStreamingCaptureScreen = async () => {
  try {
    loadingText.value = 'Starting Capture Screen...'
    clearSelect()
    stopMediaStreaming()
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
  } catch (error: any) {
    console.error(error)
    window.$notification({
      type: 'error',
      message: error.message,
      timeout: 5000,
    })
  } finally {
    loadingText.value = ''
  }
}

const handleScreenshot = () => {
  const url = snapVideoImage(videoRef.value)
  downloadUrl(url, `screenshot_${moment().format('YYYY-MM-DD_HH-mm-ss')}.png`)
}

let videoRecorder = ref<VideoRecorder | null>(null)
onMounted(() => {
  videoRecorder.value = new VideoRecorder(videoRef.value)
})

const showSettings = ref(false)

const videoFilterStyle = computed(() => {
  const style: any = {}
  if (settingsStore.filterMirrorX && settingsStore.filterMirrorY) {
    style.transform = `rotateX(180deg) rotateY(180deg)`
  } else if (settingsStore.filterMirrorX) {
    style.transform = `rotateX(180deg)`
  } else if (settingsStore.filterMirrorY) {
    style.transform = `rotateY(180deg)`
  }
  if (settingsStore.inputFilter) {
    style.filter = settingsStore.inputFilter
  } else if (settingsStore.selectedFilters) {
    style.filter = settingsStore.selectedFilters.join(' ')
  }
  if (settingsStore.fitMode) {
    style.objectFit = settingsStore.fitMode
  }
  return style
})

const kvmInputRef = ref()
const absMouseRef = ref()
// 进入KVM控制模式
const enterInputMode = () => {
  if (!kvmInputRef.value) {
    return
  }
  kvmInputRef.value.autoEnable(absMouseRef.value)
}

const isFolded = useStorage('actions_is_folded', false)
</script>

<template>
  <div ref="rootRef" class="web-mediadevices-player" @click="enterInputMode">
    <transition name="fade">
      <div class="loading-layer" v-if="loadingText">⌛ {{ loadingText }}</div>
    </transition>
    <div @click.stop :class="{absolute: settingsStore.autoHideUI}" class="action-bar-wrap">
      <div
        ref="actionBarRef"
        class="action-bar font-emoji"
        :class="{
          visible:
            !settingsStore.autoHideUI ||
            (!settingsStore.currentVideoDeviceId && !settingsStore.currentAudioDeviceId),
        }"
      >
        <div class="action-bar-side">
          <button class="themed-button" @click="isFolded = !isFolded">
            {{ isFolded ? '▶️' : '◀️' }}
          </button>
          <div v-show="!isFolded" class="flex-row-center-gap">
            <label for="videoSelect">
              <span>Video:</span>
              <template v-if="permissionCamera === 'granted'">
                <select
                  class="themed-button"
                  title="Video"
                  id="videoSelect"
                  v-model="settingsStore.currentVideoDeviceId"
                  @change="handleStartStreaming"
                >
                  <option
                    v-for="item in videoDeviceList"
                    :key="item.deviceId"
                    :value="item.deviceId"
                  >
                    {{ item.label }}
                  </option>
                </select>
              </template>
              <button class="themed-button" v-else @click="initDevices">
                ⚠️ {{ permissionCamera }}
              </button>
            </label>

            <label for="audioSelect">
              <span>Audio:</span>
              <template v-if="permissionMicrophone === 'granted'">
                <select
                  class="themed-button"
                  name="Audio"
                  id="audioSelect"
                  v-model="settingsStore.currentAudioDeviceId"
                  @change="handleStartStreaming"
                >
                  <option
                    v-for="item in audioDeviceList"
                    :key="item.deviceId"
                    :value="item.deviceId"
                  >
                    {{ item.label }}
                  </option>
                </select>
              </template>
              <button class="themed-button" v-else @click="initDevices">
                ⚠️ {{ permissionMicrophone }}
              </button>
            </label>

            <button class="themed-button" @click="stopMediaStreaming" v-if="isStreaming">
              ⏹Stop
            </button>
            <button class="themed-button" @click="handleStartStreaming" v-else>▶Start</button>
            <button class="themed-button" @click="clearSelect">🛑Reset</button>

            <span style="opacity: 0.5">|</span>
            <button
              class="themed-button"
              @click="handleStartStreamingCaptureScreen"
              title="Capture Screen"
            >
              🖥️Screen...
            </button>

            <QRScanner :disabled="!isStreaming" />

            <button
              class="themed-button"
              @click="handleScreenshot"
              title="Take a photo"
              :disabled="!isStreaming"
            >
              📷Screenshot
            </button>

            <template v-if="videoRecorder">
              <button
                class="themed-button"
                v-if="Boolean(videoRecorder.mediaRecorder)"
                @click="videoRecorder.stop()"
                title="Save record"
                style="background: #f44336"
              >
                📹Save
              </button>
              <button
                v-else
                class="themed-button"
                @click="videoRecorder.start()"
                :disabled="!isStreaming"
                title="Record canvas"
              >
                📹Record...
              </button>
            </template>
          </div>

          <template v-if="settingsStore.enableKvmInput">
            <span style="opacity: 0.5">|</span>
            <KvmInput ref="kvmInputRef" @connected="enterInputMode" />
          </template>
        </div>

        <div class="action-bar-side right">
          <button @click="showSettings = !showSettings" title="Settings" class="themed-button">
            ⚙️
          </button>
          <button v-if="!isTauri" @click="toggleFullScreen" class="themed-button">
            {{ isFullscreen ? '╳' : '⛶' }}
            <!--&#x26F6;-->
            <!-- https://www.compart.com/en/unicode/category/So -->
          </button>
          <TauriActions v-if="isTauri" />
        </div>
      </div>
    </div>

    <div class="video-wrapper" @dblclick.stop="toggleFullScreen">
      <div
        v-show="settingsStore.enableKvmInput && settingsStore.cursorMode === 'absolute'"
        class="abs-mouse-container"
      >
        <div
          class="abs-mouse-area"
          :class="{showBorder: showSettings}"
          ref="absMouseRef"
          :style="{
            width: settingsStore.absMouseAreaWidth + '%',
            height: settingsStore.absMouseAreaHeight + '%',
          }"
        ></div>
      </div>
      <video
        ref="videoRef"
        id="streamVideo"
        autoplay
        playsinline
        :controls="settingsStore.isShowControls"
        :style="videoFilterStyle"
      ></video>
    </div>

    <div class="video-fg-layer" v-if="settingsStore.filterShowFg"></div>

    <SettingsPrompt @click.stop v-model:visible="showSettings" />
  </div>
</template>

<style lang="scss">
.web-mediadevices-player {
  background-color: black;
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .action-bar-wrap {
    z-index: 10;
    user-select: none;

    .action-bar {
      height: 100%;
      padding: 4px;
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
      a {
        text-decoration: none;
      }

      select {
        width: 150px;
        line-height: 1;

        option {
          background: white;
          color: black;
        }
      }

      select {
        //option {
        //  background-color: #303030;
        //  color: white;
        //}
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

    &.absolute {
      position: absolute;
      left: 0;
      right: 0;
      height: 70px;
      .action-bar {
        padding: 10px;
      }
    }
  }

  .video-wrapper {
    flex: 1;
    overflow: hidden;
    position: relative;

    video {
      width: 100%;
      height: 100%;
      /* object-fit: contain; */
      transition: all 1s;
    }
    .abs-mouse-container {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      .abs-mouse-area {
        width: 100%;
        height: 100%;
        &.showBorder {
          outline: 2px solid #f44336;
          outline-offset: -2px;
          &::before {
            content: 'Abs Mouse Area';
            background-color: #f44336;
            color: white;
            font-size: 12px;
            font-style: italic;
            margin: 0;
            position: absolute;
            padding: 2px 6px;
            font-weight: bold;
          }
        }
        cursor: crosshair;
      }
    }
  }

  .video-fg-layer {
    position: absolute;
    content: '';
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-image: linear-gradient(
      22.5deg,
      #000 25%,
      transparent 25%,
      transparent 50%,
      #000 50%,
      #000 75%,
      transparent 75%,
      transparent
    );
    z-index: 2;
    background-size: 4px 4px;
    pointer-events: none;
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
    transition: all 0.3s;
  }

  .loading-layer.visible {
    visibility: visible;
    opacity: 1;
  }
}
</style>
