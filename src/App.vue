<script>
import { defineComponent, onMounted, ref, computed, shallowRef } from 'vue'
import { useLocalStorageBoolean, useLocalStorageString, useLocalStorageObject } from './hooks/use-local-storage'

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

// async function startDisplayCapture(displayMediaOptions) {
//   let captureStream;

//   try {
//     captureStream = await navigator.mediaDevices.getDisplayMedia(
//       displayMediaOptions
//     );
//   } catch (err) {
//     console.error(`Error: ${err}`);
//   }
//   return captureStream;
// }


export default defineComponent({
  setup() {
    const isLoading = ref(true)
    const isShowControls = useLocalStorageBoolean('ls_key_is_show_controls', true)
    const deviceList = ref([])
    const videoRef = ref()
    const currentVideoDeviceId = useLocalStorageString('ls_key_video_device_id', '')
    const currentAudioDeviceId = useLocalStorageString('ls_key_audio_device_id', '')
    // save config for next time reload
    const videoConfig = useLocalStorageObject('ls_key_video_config')
    const mediaStreamRef = shallowRef()

    const filterDeviceList = (list, kind) => {
      return list.filter(item => item.kind === kind && !!item.deviceId)
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

    onMounted(async () => {
      try {
        if (currentVideoDeviceId.value || currentAudioDeviceId.value) {
          await startMediaStream()
          await updateDeviceList()

          navigator.mediaDevices.ondevicechange = async () => {
            // console.log('ondevicechange', event)
            await updateDeviceList()
          };
          return
        }

        mediaStreamRef.value = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        })

        stopBothVideoAndAudio()
        await updateDeviceList()

        navigator.mediaDevices.ondevicechange = async () => {
          // console.log('ondevicechange', event)
          await updateDeviceList()
        };

      } catch (e) {
        console.error(e)
        alert('Error: ' + e.message)
      }
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
            const vDevice = videoDeviceList.value.find(i => {
              return i.deviceId === videoId
            })
            console.log(vDevice)

            if (vDevice) {
              const conf = vDevice.getCapabilities()
              vConfig = videoConfig.value = {
                deviceId: conf.deviceId,
                height: conf.height.max,
                width: conf.width.max,
                frameRate: conf.frameRate.max
              }
            } else {
              vConfig = { deviceId: videoId }
            }
          } else {
            vConfig = videoConfig.value
          }
        }

        // console.log('vConfig', vConfig)



        var constraints = {
          // audio: true,
          audio: audioId ? {
            deviceId: audioId,
            autoGainControl: false,
            echoCancellation: false,
            noiseSuppression: false
          } : false,
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
          video: vConfig
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        mediaStreamRef.value = stream
        // console.log('stream', stream)
        const video = videoRef.value
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play();
        };
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
      tracks.forEach(track => {
        if (track.readyState == 'live') {
          track.stop();
        }
      })

    }

    const clearSelect = () => {
      stopBothVideoAndAudio()
      currentVideoDeviceId.value = ''
      currentAudioDeviceId.value = ''
      videoConfig.value = null
    }

    function toggleFullScreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      }
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
    }
  }
})
</script>

<template>
  <div class="loading-layer" :class="{ visible: isLoading }">
    Loading...
  </div>
  <div class="action-bar-wrap">

    <div class="action-bar" :class="{visible: (!currentVideoDeviceId && !currentAudioDeviceId)}">

      <label for="videoSelect">
        <span>Video:</span>
        <select title="Video" id="videoSelect" v-model="currentVideoDeviceId">
          <option v-for="(item) in videoDeviceList" :key="item.deviceId" :value="item.deviceId">{{ item.label }}
          </option>
        </select>
      </label>

      <label for="audioSelect">
        <span>Audio:</span>
        <select name="Audio" id="audioSelect" v-model="currentAudioDeviceId">
          <option v-for="(item) in audioDeviceList" :key="item.deviceId" :value="item.deviceId">{{ item.label }}
          </option>
        </select>
      </label>

      <button @click="handleStart">Start</button>
      <button @click="stopBothVideoAndAudio">Stop</button>
      <button @click="clearSelect">Reset</button>
      <button @click="toggleFullScreen">FullScreen</button>
      <input type="checkbox" v-model="isShowControls" title="Show Controls">
    </div>

  </div>
  <video ref="videoRef" id="videoId" autoplay playsinline :controls="isShowControls"></video>
</template>

<style scoped>
.action-bar-wrap {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 10;
  height: 70px;
}

.action-bar.visible,
.action-bar-wrap:hover .action-bar {
  visibility: visible;
  opacity: 1;
}

.action-bar {
  height: 100%;
  padding: 10px;

  background: linear-gradient(180deg, #0000004d, transparent);
  visibility: hidden;
  opacity: 0;
  transition: all .3s;
}

.action-bar span {
  font-size: 12px;
}

.action-bar select {
  width: 200px;
  margin-left: 5px;
  margin-right: 8px;
}

.action-bar button {
  margin-left: 2px;
  margin-right: 2px;
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
  transition: all .3s;
}

.loading-layer.visible {
  visibility: visible;
  opacity: 1;
}
</style>
