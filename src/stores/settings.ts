import {defineStore} from 'pinia'

export interface IVideoConfig {
  deviceId: string
  frameRate?: number
  height?: number
  width?: number
}

interface ISettings {
  isShowControls: boolean
  fitMode: string
  autoHideUI: boolean
  enableKvmInput: boolean
  baudRate: string
  cursorMode: 'relative' | 'absolute'
  absMouseAreaHeight: number
  absMouseAreaWidth: number

  filterMirrorX: boolean
  filterMirrorY: boolean
  filterShowFg: boolean
  selectedFilters: string[]
  inputFilter: string
  currentVideoDeviceId: string
  currentAudioDeviceId: string
  // save config for next time reload
  videoConfig: IVideoConfig | null
}

export const useSettingsStore = defineStore('settingsStore', {
  state: (): ISettings => {
    return {
      isShowControls: false,
      fitMode: 'contain',
      autoHideUI: true,
      enableKvmInput: false,
      baudRate: '',
      cursorMode: 'relative',
      absMouseAreaHeight: 100,
      absMouseAreaWidth: 100,

      filterMirrorX: false,
      filterMirrorY: false,
      filterShowFg: false,
      selectedFilters: [],
      inputFilter: '',
      currentVideoDeviceId: '',
      currentAudioDeviceId: '',
      videoConfig: null,
    }
  },
  persist: {
    key: 'ls_key_wmdp_settings',
  },
})
