import {createGlobalState} from '@vueuse/core'
import {shallowRef} from 'vue'
import type {SerialPort} from 'web-serial-polyfill'

export const useSerialState = createGlobalState(() => {
  const reader = shallowRef<any>()
  const writer = shallowRef<any>()
  const serialPort = shallowRef<SerialPort | null>(null)
  return {
    reader,
    writer,
    serialPort,
  }
})
