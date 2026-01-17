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
  floatUI: boolean
  enableKvmInput: boolean
  baudRate: string
  // 鼠标定位模式，建议在Linux客户机下启用相对模式
  cursorMode: 'relative' | 'absolute'
  absMouseAreaHeight: number
  absMouseAreaWidth: number
  // 键盘兼容模式，建议在Linux客户机下启用
  keyboardCompatibleMode: boolean

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
      floatUI: true,
      enableKvmInput: false,
      baudRate: '9600',
      cursorMode: 'absolute',
      absMouseAreaHeight: 100,
      absMouseAreaWidth: 100,
      keyboardCompatibleMode: false,

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
