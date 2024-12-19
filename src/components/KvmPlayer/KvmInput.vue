<script lang="ts" setup>
import {onBeforeUnmount, onMounted, ref, shallowRef} from 'vue'
import {useMainStore} from '@/stores/main'
import {createPrompt} from '@/components/PromptInput/use-prompt-input'
import {useEventListener, usePointerLock} from '@vueuse/core'
import {KEYS} from '@/components/KvmPlayer/utils/input-enum'
import type {SerialPort} from 'web-serial-polyfill'
import {ok} from 'assert'

const mainStore = useMainStore()

let reader = shallowRef<any>()
let writer = shallowRef<any>()
let serialPort = shallowRef<SerialPort | null>(null)

const readSerial = (...args: any) => {
  if (!reader.value) {
    mainStore.addNotification({
      type: 'error',
      message: 'Serial port not initialized',
    })
    return
  }
  return reader.value.read(...args)
}
const writeSerial = (...args: any) => {
  if (!writer.value) {
    mainStore.addNotification({
      type: 'error',
      message: 'Serial port not initialized',
    })
    return
  }
  return writer.value.write(...args)
}

const initSerial = async () => {
  try {
    let port = null
    if (navigator?.serial?.requestPort) {
      port = await navigator.serial.requestPort()
    } else if (navigator?.usb?.requestDevice) {
      // todo: using polyfill  `Failed to execute 'open' on 'USBDevice': Access denied.`
      const serialPolyfill = import('web-serial-polyfill')
      const device = await navigator.usb.requestDevice({filters: []})
      // console.log(device)
      port = new (await serialPolyfill).SerialPort(device, {
        usbControlInterfaceClass: 255,
        usbTransferInterfaceClass: 255,
      })
    }
    const baudRate = '9600' // (await createPrompt('9600', 'baud rate')) || '9600'
    // Opening port
    const opened = port.open({baudRate: +baudRate})
    const timeout = new Promise((resolve, reject) => setTimeout(reject, 900))
    await Promise.race([timeout, opened])
    reader.value = port.readable.getReader()
    writer.value = port.writable.getWriter()
    serialPort.value = port
    console.log(port)
  } catch (error: any) {
    console.error(error)
    mainStore.addNotification({
      type: 'error',
      message: error.message,
    })
  }
}
const closeSerial = () => {
  if (reader.value) {
    reader.value.releaseLock()
    reader.value = null
  }
  if (writer.value) {
    writer.value.releaseLock()
    writer.value = null
  }
  if (serialPort.value) {
    serialPort.value.close()
    serialPort.value = null
  }
}
onBeforeUnmount(() => {
  closeSerial()
})

const genPacket = (cmd = 0x01, ...data) => {
  for (const v of data) if (v < 0 || v > 0xff) throw v
  let ret = [0x57, 0xab, 0x00, cmd, data.length, ...data]
  let sum = new Uint8Array([0])
  for (const v of ret) sum[0] += v
  ret.push(sum[0])
  return ret
}
const sendText = async (text: string | null) => {
  if (!text) {
    return
  }
  // switch to the ascii mode of ch9329 needs reconnect, which is unacceptable
  for (const key of text) {
    if (!KEYS.has(key)) return alert(`char [ ${key} ] is not an ascii char`)
    const [hidCode, shift] = KEYS.get(key)
    // there's a faster strategy, press down 6 keys before release. however this will cause adjacent same chars to be wrong, like "root" became "rot"
    const value = new Uint8Array([
      ...genPacket(2, shift ? 2 : 0, 0, hidCode, 0, 0, 0, 0, 0),
      ...genPacket(2, 0, 0, 0, 0, 0, 0, 0, 0),
    ])
    // console.log({ char, hidCode, shift, value });
    await writeSerial(value)
  }
}

const rootRef = ref()
const {isSupported, lock, unlock, element, triggerElement} = usePointerLock(rootRef, {
  // 禁用操作系统级别的鼠标加速调整，而是访问原始鼠标输入。
  // https://developer.mozilla.org/en-US/docs/Web/API/Element/requestPointerLock
  // unadjustedMovement: true,
})
useEventListener(document, 'pointerlockchange', (event) => {
  if (!document.pointerLockElement) {
    console.log('Exit pointer lock')
    const el = rootRef.value
    el.onmousemove = el.onmousedown = el.onmouseup = null
    return
  }
  if (document.pointerLockElement === rootRef.value) {
    console.log('Enter pointer lock', document.pointerLockElement)
  }
  const $monitor = rootRef.value

  const i8clamp = (v: number) => Math.max(-0x7f, Math.min(v, 0x7f)) // clamp to int8
  let [pressedBits, x, y] = [0, 0, 0]
  let timer: any = null // an modified throttle strategy

  // todo: onwhell?
  $monitor.onmousemove =
    $monitor.onmousedown =
    $monitor.onmouseup =
      (e) => {
        ;(x += e.movementX), (y += e.movementY)
        if (pressedBits != e.buttons || i8clamp(x) !== x || i8clamp(y) !== y) {
          clearTimeout(timer)
          timer = null // force trigger
        }
        pressedBits = e.buttons // so lucky, coincidence or necessity?
        if (timer !== null) return
        ;(x = Math.round(x)), (y = Math.round(y))
        const value = []
        do {
          let [pX, pY] = [i8clamp(x), i8clamp(y)]
          ;(x -= pX), (y -= pY)
          if (pX < 0) pX = (0xff + pX) & 0xff
          if (pY < 0) pY = (0xff + pY) & 0xff
          // console.log({ pX, pY });
          value.push(...genPacket(5, 1, pressedBits, pX, pY, 0))
        } while (
          x !== 0 ||
          y !== 0 // use "do while" loop to send mousedown/mouseup immediately
        )
        ;(x = 0), (y = 0)
        writer.value.write(new Uint8Array(value)) // without await on purpose
        timer = setTimeout(() => (timer = null), 16)
      }
})

const showSendInput = async () => {
  const text = await createPrompt('', 'Send Text', {})
  sendText(text)
}
const eatKeys = new Set() // avoid tailing control keys (press and release key A will emit event keyup[A] and keyup[Shift])

const handleKey = async (e) => {
  e.preventDefault()
  if (!serialPort.value) {
    return
  }

  if (eatKeys.has(e.key)) return eatKeys.delete(e.key)
  // console.log(e);
  const [hidCode, shift] = KEYS.get(e.key)
  let controlBits = 0
  if (shift) controlBits |= 0b00000010
  if (e.ctrlKey) (controlBits |= 0b00000001), eatKeys.add('Control')
  if (e.shiftKey) (controlBits |= 0b00000010), eatKeys.add('Shift')
  if (e.altKey) (controlBits |= 0b00000100), eatKeys.add('Alt')
  if (e.metaKey) (controlBits |= 0b00001000), eatKeys.add('Meta')
  const value = new Uint8Array([
    ...genPacket(2, controlBits, 0, hidCode, 0, 0, 0, 0, 0),
    ...genPacket(2, 0, 0, 0, 0, 0, 0, 0, 0),
  ])
  await writeSerial(value)
}

const selectedComboKey = ref('')
const comboKeyOptions = [
  {value: '', label: 'Send Combo Keys...'},
  {value: 'alt_f4', label: 'Alt+F4'},
  {value: 'ctrl_alt_del', label: 'Ctrl+Alt+Del'},
  {value: 'ctrl_alt_f1', label: 'Ctrl+Alt+F1'},
  {value: 'ctrl_alt_f2', label: 'Ctrl+Alt+F2'},
  {value: 'ctrl_alt_f3', label: 'Ctrl+Alt+F3'},
  {value: 'ctrl_alt_f4', label: 'Ctrl+Alt+F4'},
  {value: 'ctrl_alt_f5', label: 'Ctrl+Alt+F5'},
  {value: 'ctrl_alt_f6', label: 'Ctrl+Alt+F6'},
  {value: 'ctrl_alt_f7', label: 'Ctrl+Alt+F7'},
  {value: 'ctrl_alt_f8', label: 'Ctrl+Alt+F8'},
  {value: 'ctrl_alt_f9', label: 'Ctrl+Alt+F9'},
]
const handleSendComboKey = async () => {
  const value = selectedComboKey.value
  if (!value) {
    return
  }

  let key, controlBits
  if (value === 'alt_f4') [key, controlBits] = ['F4', 0b00000100]
  if (value === 'ctrl_alt_del') [key, controlBits] = ['Delete', 0b00000101]
  if (/^ctrl_alt_f\d+$/.test(value)) [key, controlBits] = ['F' + value.slice(10), 0b00000101]
  const [hidCode] = KEYS.get(key)
  const sv = new Uint8Array([
    ...genPacket(2, controlBits, 0, hidCode, 0, 0, 0, 0, 0),
    ...genPacket(2, 0, 0, 0, 0, 0, 0, 0, 0),
  ])
  await writeSerial(sv)

  selectedComboKey.value = ''
}

const autoEnable = () => {
  if (!serialPort.value) {
    initSerial()
    return
  }
  rootRef.value.focus()
  lock(rootRef.value)
}

defineExpose({
  autoEnable,
})
</script>

<template>
  <div @keydown="handleKey" ref="rootRef" class="kvm-input flex-row-center-gap" tabindex="-1">
    <button v-if="!serialPort" @click="initSerial" class="themed-button blue">Init Serial</button>
    <template v-else>
      <button @click="closeSerial" class="themed-button">Close Serial</button>
      <!--<button @click="lock(rootRef)" class="themed-button blue">Capture Mouse</button>-->

      <button @click="showSendInput" class="themed-button">Send Text...</button>
      <select v-model="selectedComboKey" class="themed-button" @change="handleSendComboKey">
        <option v-for="item in comboKeyOptions" :key="item.value" :value="item.value">
          {{ item.label }}
        </option>
      </select>
    </template>
  </div>
</template>

<style scoped lang="scss">
.kvm-input {
  outline: none;
}
</style>
