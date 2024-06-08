import {defineStore} from 'pinia'

export interface IVideoConfig {
  deviceId: string
  frameRate?: number
  height?: number
  width?: number
}

interface ISettings {
  isShowControls: boolean
  currentVideoDeviceId: string
  currentAudioDeviceId: string
  // save config for next time reload
  videoConfig: IVideoConfig | null
}

export const useSettingsStore = defineStore('settingsStore', {
  state: (): ISettings => {
    return {
      isShowControls: false,
      currentVideoDeviceId: '',
      currentAudioDeviceId: '',
      videoConfig: null,
    }
  },
  persist: {
    key: 'ls_key_wmdp_settings',
  },
})
