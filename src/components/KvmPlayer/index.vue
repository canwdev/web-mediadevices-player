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
import {useActionBar} from '@/components/KvmPlayer/hooks/use-action-bar'
import DragButton from '@/components/KvmPlayer/UI/DragButton.vue'

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

const rootRef = shallowRef()

const {actionBarRef, isShowFloatBar, isShowFloatBarInNonKvmMode} = useActionBar()

const permissionCamera = usePermission('camera')
const permissionMicrophone = usePermission('microphone')

const requirePermission = () => {
  clearSelect()
  initDevices()
}

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
})

onBeforeUnmount(() => {
  stopMediaStreaming()
})

const graphInfo = ref({
  width: 1,
  height: 1,
  aspectRatio: 1,
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
      console.warn(video, video.videoWidth, video.videoHeight)
      graphInfo.value = {
        width: video.videoWidth,
        height: video.videoHeight,
        aspectRatio: video.videoWidth / video.videoHeight,
      }
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

const isFolded = useStorage('wmd__actions_is_folded', false)

const isActionBarVisible = computed(() => {
  return (
    (isShowFloatBar.value && settingsStore.floatUI && settingsStore.enableKvmInput) ||
    !settingsStore.floatUI ||
    (!settingsStore.enableKvmInput && isShowFloatBarInNonKvmMode.value)
  )
})
</script>

<template>
  <div ref="rootRef" class="web-mediadevices-player" @click="enterInputMode">
    <transition name="fade">
      <div class="loading-layer" v-if="loadingText">⌛ {{ loadingText }}</div>
    </transition>
    <div @click.stop :class="[settingsStore.floatUI ? 'float-ui' : null]" class="action-bar-wrap">
      <DragButton
        v-if="settingsStore.floatUI && settingsStore.enableKvmInput"
        :docked="!isShowFloatBar"
        @click.stop="isShowFloatBar = !isShowFloatBar"
      />
      <div
        ref="actionBarRef"
        class="action-bar font-emoji"
        :class="[
          settingsStore.floatUI && 'float-bar',
          {
            visible: isActionBarVisible,
          },
        ]"
      >
        <transition name="fade-left">
          <div style="transition-delay: 0.3s" v-show="isActionBarVisible" class="action-bar-side">
            <div class="flex-row-center-gap">
              <label
                class="select-label-wrapper"
                for="videoSelect"
                title="Select Video Device"
                :class="{activated: settingsStore.currentVideoDeviceId}"
              >
                <span class="mdi mdi-monitor"></span>
                <template v-if="permissionCamera === 'granted'">
                  <select
                    class="btn-no-style"
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
                <button
                  :title="permissionCamera"
                  class="btn-no-style icon-alert"
                  v-else
                  @click="requirePermission"
                >
                  ⚠️
                </button>
              </label>

              <label
                class="select-label-wrapper"
                for="audioSelect"
                title="Select Audio Device"
                :class="{activated: settingsStore.currentAudioDeviceId}"
              >
                <span class="mdi mdi-speaker"></span>
                <template v-if="permissionMicrophone === 'granted'">
                  <select
                    class="btn-no-style"
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
                <button
                  class="btn-no-style icon-alert"
                  :title="permissionMicrophone"
                  v-else
                  @click="requirePermission"
                >
                  ⚠️
                </button>
              </label>

              <button
                class="btn-no-style orange"
                @click="stopMediaStreaming"
                v-if="isStreaming"
                title="⏹ Stop Media Devices"
              >
                <span class="mdi mdi-stop-circle-outline"></span>
              </button>
              <button
                class="btn-no-style green"
                title="▶ Start Media Devices"
                @click="handleStartStreaming"
                v-else
              >
                <span class="mdi mdi-play-circle-outline"></span>
              </button>
              <button class="btn-no-style" @click="clearSelect" title="🛑 Reset All Media Devices">
                <span class="mdi mdi-close-circle-outline"></span>
              </button>

              <button title="More" class="btn-no-style" @click="isFolded = !isFolded">
                <span v-if="!isFolded" class="mdi mdi-chevron-left"></span>
                <span v-else class="mdi mdi-chevron-right"></span>
              </button>

              <transition name="fade-right">
                <div v-show="!isFolded" class="action-bar-side">
                  <button
                    class="btn-no-style"
                    @click="handleStartStreamingCaptureScreen"
                    title="🖥️ Capture Screen..."
                  >
                    <span class="mdi mdi-cast-variant"></span>
                  </button>

                  <QRScanner :disabled="!isStreaming" />

                  <button
                    class="btn-no-style"
                    @click="handleScreenshot"
                    :disabled="!isStreaming"
                    title="📷 Screenshot"
                  >
                    <span class="mdi mdi-monitor-screenshot"></span>
                  </button>

                  <template v-if="videoRecorder">
                    <button
                      class="btn-no-style recording"
                      v-if="Boolean(videoRecorder.mediaRecorder)"
                      @click="videoRecorder.stop()"
                      title="📹 Recording, click to save record"
                    >
                      <span class="mdi mdi-record"></span>
                    </button>
                    <button
                      v-else
                      class="btn-no-style"
                      @click="videoRecorder.start()"
                      :disabled="!isStreaming"
                      title="📹 Record"
                    >
                      <span class="mdi mdi-record-circle-outline"></span>
                    </button>
                  </template>
                </div>
              </transition>
            </div>
          </div>
        </transition>

        <transition name="fade-right">
          <div
            style="transition-delay: 0.3s"
            v-show="isActionBarVisible"
            class="action-bar-side right"
          >
            <template v-if="settingsStore.enableKvmInput">
              <KvmInput ref="kvmInputRef" @connected="enterInputMode" />
              <span style="opacity: 0.5">|</span>
            </template>

            <button @click="showSettings = !showSettings" title="Settings" class="btn-no-style">
              <span class="mdi mdi-cog"></span>
            </button>
            <button
              v-if="!isTauri"
              @click="toggleFullScreen"
              class="btn-no-style"
              title="Fullscreen"
            >
              <span v-if="!isFullscreen" class="mdi mdi-fullscreen"></span>
              <span v-else class="mdi mdi-fullscreen-exit"></span>

              <!--{{ isFullscreen ? '🗔' : '⛶' }}-->
              <!--&#x26F6;-->
              <!--╳-->
              <!-- https://www.compart.com/en/unicode/category/So -->
            </button>
            <TauriActions v-if="isTauri" />
          </div>
        </transition>
      </div>
    </div>

    <div class="main-graph-wrapper">
      <div
        class="video-wrapper"
        @dblclick.stop="toggleFullScreen"
        :style="
          settingsStore.fitMode === 'contain'
            ? {aspectRatio: graphInfo.aspectRatio}
            : {width: '100%', height: '100%'}
        "
      >
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
  --radius: 8px;
  --bg: black;

  .action-bar-wrap {
    z-index: 10;
    user-select: none;
    pointer-events: none;

    &.float-ui {
      position: absolute;
      left: 0;
      right: 0;
      padding-top: 10px;
    }

    .action-bar {
      height: 100%;
      padding: 4px;
      background: linear-gradient(180deg, rgba(0, 0, 0, 0.53), transparent);
      transition: opacity 0.3s;
      display: flex;
      align-items: center;

      justify-content: space-between;
      gap: 8px;
      pointer-events: auto;
      visibility: visible;
      opacity: 1;

      &.float-bar {
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(10px);
        outline: 1px solid rgba(255, 255, 255, 0.1);

        border-radius: 100px;
        align-items: center;

        margin: 0 auto;
        max-width: 1000px;

        visibility: hidden;
        opacity: 0;
        width: 0;
        height: 0;
        overflow: hidden;
        transition: all 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28);

        &.visible {
          visibility: visible;
          opacity: 1;

          width: 500px;
          height: 30px;
          min-height: 28px;
          padding: 4px 14px;

          transition-delay: 0.15s;
        }

        .flex-row-center-gap {
          gap: 4px;
        }

        .select-label-wrapper {
          border-radius: 4px;
          width: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: all 0.1s;

          &:hover {
            background-color: rgba(203, 203, 203, 0.4);
          }

          &::after {
            left: 4px;
            right: 4px;
          }

          select {
            position: absolute;
            z-index: 2;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            opacity: 0;
          }

          .icon-alert {
            position: absolute;
            z-index: 2;
            right: 0;
            bottom: 0;
          }
        }
      }

      span,
      a {
        font-size: 12px;
      }

      a {
        text-decoration: none;
      }

      .select-label-wrapper {
        position: relative;

        &.activated {
          &::after {
            background-color: #4caf50;
          }
        }

        &::after {
          content: ' ';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background-color: currentColor;
          border-radius: 10px;
          pointer-events: none;
        }

        .mdi {
          position: relative;
          z-index: 1;
          pointer-events: none;
        }
      }

      select {
        width: 50px;
        line-height: 1;
        font-size: 12px;
        background: black !important;

        option {
          color: white;
          background: #252525;
        }
      }

      select {
      }

      .action-bar-side {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;

        &.right {
          justify-content: flex-end;
          flex-wrap: nowrap;
        }

        label {
          display: flex;
          align-items: center;
          gap: 2px;
        }
      }

      select {
        width: 100px;
      }

      .mdi {
        font-size: 18px;
      }

      .recording {
        color: #f44336;
        animation: linear blink-animation 3s infinite;
      }

      .btn-no-style {
        display: flex;
        line-height: 1;
        border-radius: 100px;
        padding: 2px;
        transition: all 0.1s;

        &:hover {
          background-color: rgba(203, 203, 203, 0.4);
        }

        &.blue {
          color: #2196f3;
        }

        &.green {
          color: #4caf50;
        }

        &.orange {
          color: #ffcc00;
        }

        &.red {
          color: #f44336;
        }
      }
    }
  }

  .main-graph-wrapper {
    overflow: hidden;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .video-wrapper {
    max-width: 100%;
    max-height: 100%;
    position: relative;

    video {
      width: 100%;
      height: 100%;
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

        //cursor:
        //  url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="%23000" stroke-width="0.25"><circle cx="12" cy="12" r="8.5"></circle><path d="M1 12h5M18 12h5M12 6V1.04M12 23v-4.96M11.95 11.95h.1v.1h-.1z"></path></g></svg>')
        //    12 12,
        //  crosshair;
        //cursor:
        //  url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="%23FFF" stroke="%23000" stroke-width="2"></circle></svg>')
        //    3 3,
        //  crosshair;
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
