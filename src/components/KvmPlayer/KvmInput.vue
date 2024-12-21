<script lang="ts" setup>
import {onBeforeUnmount, onMounted, Ref, ref, shallowRef, watch} from 'vue'
import {createPrompt} from '@/components/PromptInput/prompt-input'
import {useEventListener, useMouse, usePointerLock} from '@vueuse/core'
import {ASCII_KEYS} from '@/components/KvmPlayer/utils/keys-enum'
import {useSerialState} from '@/components/KvmPlayer/utils/serial-state'
import {
  CmdType,
  decomposeHexToBytes,
  genPacket,
  i8clamp,
  indexToBinary,
  MediaKey,
  mediaKeyMatrix,
} from '@/components/KvmPlayer/utils/ch9329'
import {useSettingsStore} from '@/stores/settings'
import {copy, sleep, snapVideoImage} from '@/components/KvmPlayer/utils'
import QrcodeDecoder from '@/components/KvmPlayer/utils/qrcode-decoder'
import {eventBus} from '@/utils/event-bus'

const emit = defineEmits(['connected', 'disconnected'])

const settingsStore = useSettingsStore()
const {reader, writer, serialPort} = useSerialState()

const writeSerial = (...args: any) => {
  if (!writer.value) {
    window.$notification({
      type: 'error',
      message: 'Serial port not initialized',
      timeout: 3000,
    })
    return
  }
  // console.log(args)
  return writer.value.write(...args)
}

// 循环读取串口输出
async function readLoop(reader) {
  while (true) {
    try {
      // 从串口读取数据
      const {value, done} = await reader.read()
      if (done) {
        // 读取结束
        console.log('Stream closed')
        break
      }
      // 处理读取的数据
      console.log(value)
    } catch (error) {
      console.error('Read error: ', error)
      break
    }
  }
}

const initSerial = async () => {
  if (serialPort.value) {
    return
  }
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
    const baudRate = settingsStore.baudRate || (await createPrompt('9600', 'baud rate')) || '9600'
    settingsStore.baudRate = baudRate

    // Opening port
    const opened = port.open({baudRate: +baudRate})
    const timeout = new Promise((resolve, reject) => setTimeout(reject, 900))
    await Promise.race([timeout, opened])
    reader.value = await port.readable.getReader()
    writer.value = await port.writable.getWriter()
    serialPort.value = port
    console.log(port)
    emit('connected', port)

    // readLoop(reader.value)
  } catch (error: any) {
    console.error(error)
    window.$notification({
      type: 'error',
      message: error.message,
      timeout: 5000,
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
  releaseAbsoluteMouse()
  emit('disconnected')
}
onBeforeUnmount(() => {
  // closeSerial()
})

const sendText = async (text: string | null) => {
  if (!text) {
    return
  }
  // switch to the ascii mode of ch9329 needs reconnect, which is unacceptable
  for (const key of text) {
    if (!ASCII_KEYS.has(key)) {
      window.$notification({
        type: 'error',
        message: `char [ ${key} ] is not an ascii char`,
        timeout: 3000,
      })
      return
    }
    const [hidCode, shift] = ASCII_KEYS.get(key)
    // there's a faster strategy, press down 6 keys before release. however this will cause adjacent same chars to be wrong, like "root" became "rot"
    const value = new Uint8Array([
      ...genPacket(CmdType.CMD_SEND_KB_GENERAL_DATA, shift ? 2 : 0, 0, hidCode, 0, 0, 0, 0, 0),
      ...genPacket(CmdType.CMD_SEND_KB_GENERAL_DATA, 0, 0, 0, 0, 0, 0, 0, 0),
    ])
    // console.log({ char, hidCode, shift, value });
    await writeSerial(value)
    await sleep(2)
  }
}

const rootRef = ref()

// https://developer.mozilla.org/en-US/docs/Web/API/Element/requestPointerLock
const {isSupported, lock, unlock, element, triggerElement} = usePointerLock(rootRef, {
  unadjustedMovement: true,
})

const handleRelativeMouseWheel = async (event: WheelEvent) => {
  // event.deltaY 表示滚动距离
  let value
  if (event.deltaY > 0) {
    // console.log('向下滚动', event.deltaY)
    value = new Uint8Array(genPacket(CmdType.CMD_SEND_MS_REL_DATA, 1, 0, 0, 0, 0xfd))
  } else {
    // console.log('向上滚动', event.deltaY)

    value = new Uint8Array(genPacket(CmdType.CMD_SEND_MS_REL_DATA, 1, 0, 0, 0, 0x02))
  }
  await writeSerial(value)
}

// 鼠标锁定，相对鼠标模式
useEventListener(document, 'pointerlockchange', (event) => {
  if (!document.pointerLockElement) {
    console.log('Exit pointer lock')
    const el = rootRef.value
    el.onmousemove = el.onmousedown = el.onmouseup = null
    document.removeEventListener('wheel', handleRelativeMouseWheel)

    return
  }
  console.log('Enter pointer lock', event, document.pointerLockElement)
  const el = rootRef.value

  let [pressedBits, x, y] = [0, 0, 0]
  let timer: any = null // a modified throttle strategy

  document.addEventListener('wheel', handleRelativeMouseWheel)
  el.onmousemove =
    el.onmousedown =
    el.onmouseup =
      (event: MouseEvent) => {
        /*        const pressedBits = event.buttons // so lucky, coincidence or necessity?
        const x = Math.round(event.movementX)
        const y = Math.round(event.movementY)

        let [pX, pY] = [i8clamp(x), i8clamp(y)]
        if (pX < 0) pX = (0xff + pX) & 0xff
        if (pY < 0) pY = (0xff + pY) & 0xff
        writeSerial(
          new Uint8Array(genPacket(CmdType.CMD_SEND_MS_REL_DATA, 0x01, pressedBits, pX, pY, 0)),
        )*/

        x += event.movementX
        y += event.movementY
        if (pressedBits != event.buttons || i8clamp(x) !== x || i8clamp(y) !== y) {
          clearTimeout(timer)
          timer = null // force trigger
        }
        pressedBits = event.buttons // so lucky, coincidence or necessity?
        if (timer !== null) return
        x = Math.round(x)
        y = Math.round(y)
        const value: any = []
        do {
          let [pX, pY] = [i8clamp(x), i8clamp(y)]
          x -= pX
          y -= pY
          if (pX < 0) pX = (0xff + pX) & 0xff
          if (pY < 0) pY = (0xff + pY) & 0xff
          // console.log({pressedBits, pX, pY})
          value.push(...genPacket(CmdType.CMD_SEND_MS_REL_DATA, 0x01, pressedBits, pX, pY, 0))
        } while (
          x !== 0 ||
          y !== 0 // use "do while" loop to send mousedown/mouseup immediately
        )
        x = 0
        y = 0
        writer.value.write(new Uint8Array(value)) // without await on purpose
        timer = setTimeout(() => (timer = null), 16)
      }
})

// 绝对鼠标模式
const absMouseRef = ref()
const releaseAbsoluteMouse = () => {
  const absEl = absMouseRef.value
  absMouseRef.value = null
  if (!absEl) {
    return
  }
  absEl.oncontextmenu = absEl.ondblclick = null
  absEl.onmousemove = absEl.onmousedown = absEl.onmouseup = null
  document.removeEventListener('wheel', handleRelativeMouseWheel)
}
onBeforeUnmount(() => {
  releaseAbsoluteMouse()
})
const bindAbsoluteMouse = (absEl) => {
  absMouseRef.value = absEl

  document.addEventListener('wheel', handleRelativeMouseWheel)
  absEl.oncontextmenu = (e) => e.preventDefault()
  absEl.ondblclick = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  absEl.onmousemove =
    absEl.onmousedown =
    absEl.onmouseup =
      (event: MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()

        let pressedBits = event.buttons

        const rect = absEl.getBoundingClientRect()
        const screenWidth = rect.width
        const screenHeight = rect.height

        // 计算鼠标相对于元素左上角的坐标
        let offsetX = event.clientX - rect.left
        let offsetY = event.clientY - rect.top
        // if (settingsStore.filterMirrorY) {
        //   offsetX = rect.width - offsetX
        // }
        // if (settingsStore.filterMirrorX) {
        //   offsetY = rect.height - offsetY
        // }

        // 计算新的位置
        let x = Math.floor((offsetX * 4096) / screenWidth)
        let y = Math.floor((offsetY * 4096) / screenHeight)
        // console.log({
        //   event,
        //   offsetX,
        //   offsetY,
        //   screenWidth,
        //   screenHeight,
        //   x,
        //   y,
        // })

        writeSerial(
          new Uint8Array(
            genPacket(
              CmdType.CMD_SEND_MS_ABS_DATA,
              0x02,
              pressedBits,
              ...decomposeHexToBytes(x),
              ...decomposeHexToBytes(y),
              0,
            ),
          ),
        )
      }
}
watch(
  () => settingsStore.cursorMode,
  (mode) => {
    if (mode === 'relative') {
      releaseAbsoluteMouse()
      return
    }
  },
  {immediate: true},
)

const showSendInput = async () => {
  const text = await createPrompt('', 'Send Text', {})
  sendText(text)
}

const handleKeydown = async (event: KeyboardEvent) => {
  if (!serialPort.value) {
    return
  }
  event.preventDefault()

  if (event.ctrlKey && event.altKey) {
    await unlock()
  }

  const [hidCode, shift] = ASCII_KEYS.get(event.key)
  let controlBits = 0
  if (shift) {
    controlBits |= 0b00000010
  }
  if (event.ctrlKey) {
    controlBits |= 0b00000001
  }
  if (event.shiftKey) {
    controlBits |= 0b00000010
  }
  if (event.altKey) {
    controlBits |= 0b00000100
  }
  if (event.metaKey) {
    controlBits |= 0b00001000
  }
  const value = new Uint8Array([
    ...genPacket(CmdType.CMD_SEND_KB_GENERAL_DATA, controlBits, 0, hidCode, 0, 0, 0, 0, 0),
  ])
  await writeSerial(value)
}
const handleKeyup = async (event: KeyboardEvent) => {
  if (!serialPort.value) {
    return
  }
  event.preventDefault()
  const value = new Uint8Array([
    ...genPacket(CmdType.CMD_SEND_KB_GENERAL_DATA, 0, 0, 0, 0, 0, 0, 0, 0),
  ])
  await writeSerial(value)
}
useEventListener(document, 'keydown', handleKeydown)
useEventListener(document, 'keyup', handleKeyup)

const selectedTransfer = ref('')
const transferOptions = [
  {
    value: '',
    label: '📜 Transfer',
  },
  {
    value: 'send_text',
    label: 'Send Text...',
    action() {
      showSendInput()
    },
  },
  {
    value: 'scan_qr',
    label: 'Scan QR Code',
    async action() {
      eventBus.emit('scan_qr')
    },
  },
  {
    value: 'scan_qr_from_image',
    label: 'Scan QR Code From Image...',
    async action() {
      eventBus.emit('scan_qr_from_image')
    },
  },
]
const handleTransferSelect = async () => {
  const item = transferOptions.find((i) => i.value === selectedTransfer.value)
  if (!item) {
    return
  }
  await item.action()

  selectedTransfer.value = ''
}

const selectedComboKey = ref('')
const specialKeyOptions = [
  {value: '', label: '⌨️ Combo Keys'},
  {
    value: 'ctrl_alt_del',
    label: 'Ctrl + Alt + Del',
    values: {
      key: 'Delete',
      controlBits: 0b00000101,
    },
  },
  {
    value: 'alt_f4',
    label: 'Alt + F4',
    values: {
      key: 'F4',
      controlBits: 0b00000100,
    },
  },
  {
    value: 'shift_alt',
    label: 'Shift + Alt',
    values: {
      controlBits: 0b00000110,
    },
  },
  {
    value: 'ctrl_space',
    label: 'Ctrl + Space',
    values: {
      key: ' ',
      controlBits: 0b00000001,
    },
  },
  {
    value: 'alt_space',
    label: 'Alt + Space',
    values: {
      key: ' ',
      controlBits: 0b00000100,
    },
  },
  {
    value: 'meta',
    label: 'Meta',
    values: {
      controlBits: 0b00001000,
    },
  },
  {
    value: 'alt_tab',
    label: 'Meta + Tab',
    values: {
      key: 'Tab',
      controlBits: 0b00001000,
    },
  },
  {
    value: 'esc',
    label: 'Esc',
    values: {
      key: 'Escape',
    },
  },
  {label: '-----------------', disabled: true},
  {value: 'ctrl_alt_f1', label: 'Ctrl + Alt + F1'},
  {value: 'ctrl_alt_f2', label: 'Ctrl + Alt + F2'},
  {value: 'ctrl_alt_f3', label: 'Ctrl + Alt + F3'},
  {value: 'ctrl_alt_f4', label: 'Ctrl + Alt + F4'},
  {value: 'ctrl_alt_f5', label: 'Ctrl + Alt + F5'},
  {value: 'ctrl_alt_f6', label: 'Ctrl + Alt + F6'},
  {value: 'ctrl_alt_f7', label: 'Ctrl + Alt + F7'},
  {value: 'ctrl_alt_f8', label: 'Ctrl + Alt + F8'},
  {value: 'ctrl_alt_f9', label: 'Ctrl + Alt + F9'},
]
const handleSendComboKey = async () => {
  const value = selectedComboKey.value
  if (!value) {
    return
  }

  let key: string = ''
  let controlBits
  let hidCode = 0

  if (/^ctrl_alt_f\d+$/.test(value)) {
    key = 'F' + value.slice(10)
    controlBits = 0b00000101
  } else {
    const item = specialKeyOptions.find((i) => i.value === value)
    if (!item) {
      return
    }
    key = item.values?.key || ''
    controlBits = item.values?.controlBits || 0
  }
  if (key) {
    const [_hidCode] = ASCII_KEYS.get(key)
    hidCode = _hidCode || 0
  }

  const sv = new Uint8Array([
    ...genPacket(CmdType.CMD_SEND_KB_GENERAL_DATA, controlBits, 0, hidCode, 0, 0, 0, 0, 0),
    ...genPacket(CmdType.CMD_SEND_KB_GENERAL_DATA, 0, 0, 0, 0, 0, 0, 0, 0),
  ])
  await writeSerial(sv)

  selectedComboKey.value = ''
}

const selectedMediaKey = ref('')
const mediaKeyACPIOptions = [
  {value: 0b00000100, label: '🌅 Wake-up'},
  {value: 0b00000010, label: '💤 Sleep'},
  {value: 0b00000001, label: '🔌 Power'},
]
const mediaKeyCommonGroups = [
  {
    label: 'Media Control',
    children: [
      {value: MediaKey.PREV_TRACK, label: '🔙 Previous Track'},
      {value: MediaKey.NEXT_TRACK, label: '🔜 Next Track'},
      {value: MediaKey.CD_STOP, label: '⏹️ CD Stop'},
      {value: MediaKey.PLAY_PAUSE, label: '▶️ Play/Pause'},
      {value: MediaKey.MUTE, label: '🔇 Mute'},
      {value: MediaKey.VOLUME_PLUS, label: '🔊 Volume Up'},
      {value: MediaKey.VOLUME_MINUS, label: '🔉 Volume Down'},
    ],
  },
  {
    label: 'Browser',
    children: [
      {value: MediaKey.REFRESH, label: '🔄 Refresh'},
      {value: MediaKey.STOP, label: '⏹️ Stop'},
      {value: MediaKey.FORWARD, label: '➡️ Forward'},
      {value: MediaKey.BACK, label: '⬅️ Back'},
      {value: MediaKey.HOME, label: '🏠 Home'},
      {value: MediaKey.SEARCH, label: '🔍 Search'},
    ],
  },
  {
    label: 'Apps',
    children: [
      {value: MediaKey.E_MAIL, label: '📧 E-Mail'},
      {value: MediaKey.MY_COMPUTER, label: '💻 My Computer'},
      {value: MediaKey.CALCULATOR, label: '🧮 Calculator'},
      {value: MediaKey.MEDIA, label: '🎵 Media'},
    ],
  },
]
const handleSendMedialKey = async () => {
  const value = selectedMediaKey.value
  if (!value) {
    return
  }

  const acpiItem = mediaKeyACPIOptions.find((i) => i.value === Number(value))
  if (acpiItem) {
    // 发送ACPI按键
    const sv = new Uint8Array([
      ...genPacket(CmdType.CMD_SEND_KB_MEDIA_DATA, 0x01, value),
      ...genPacket(CmdType.CMD_SEND_KB_MEDIA_DATA, 0x01, 0),
    ])
    await writeSerial(sv)
    selectedMediaKey.value = ''
    return
  }

  // 发送媒体按键
  const arr = [0, 0, 0]
  for (let i = 0; i < mediaKeyMatrix.length; i++) {
    for (let j = 0; j < mediaKeyMatrix[i].length; j++) {
      const v = mediaKeyMatrix[i][j]
      if (v === value) {
        arr[i] = indexToBinary(j)
        break
      }
    }
  }

  const sv = new Uint8Array([
    ...genPacket(CmdType.CMD_SEND_KB_MEDIA_DATA, 0x02, ...arr),
    ...genPacket(CmdType.CMD_SEND_KB_MEDIA_DATA, 0x02, 0, 0, 0),
  ])
  await writeSerial(sv)

  selectedMediaKey.value = ''
}

const autoEnable = (el) => {
  if (!serialPort.value) {
    initSerial()
    return
  }

  if (settingsStore.cursorMode === 'relative') {
    lock(rootRef.value)
  } else if (el && !absMouseRef.value) {
    bindAbsoluteMouse(el)
  }
}

defineExpose({
  autoEnable,
})
</script>

<template>
  <div ref="rootRef" class="kvm-input flex-row-center-gap scrollbar-mini" tabindex="-1">
    <button v-if="!serialPort" @click="initSerial" class="themed-button blue">
      🔌 Connect Serial
    </button>
    <template v-else>
      <button @click="closeSerial" class="themed-button" style="color: #ffcc00; font-weight: bold">
        Close Serial
      </button>
      <!--<button @click="lock(rootRef)" class="themed-button blue">Capture Mouse</button>-->

      <select v-model="selectedTransfer" class="themed-button" @change="handleTransferSelect">
        <option v-for="item in transferOptions" :key="item.value" :value="item.value">
          {{ item.label }}
        </option>
      </select>
      <select v-model="selectedComboKey" class="themed-button" @change="handleSendComboKey">
        <option
          v-for="item in specialKeyOptions"
          :key="item.value"
          :value="item.value"
          :disabled="item.disabled"
        >
          {{ item.label }}
        </option>
      </select>
      <select v-model="selectedMediaKey" class="themed-button" @change="handleSendMedialKey">
        <option :value="''">⌨️ Media Keys</option>
        <optgroup label="ACPI">
          <option v-for="item in mediaKeyACPIOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </optgroup>
        <optgroup v-for="group in mediaKeyCommonGroups" :key="group.label" :label="group.label">
          <option v-for="item in group.children" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </optgroup>
      </select>
    </template>
  </div>
</template>

<style scoped lang="scss">
.kvm-input {
  outline: none;
}
</style>
