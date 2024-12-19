<script lang="ts" setup>
import {onMounted, ref} from 'vue'
import {useMainStore} from '@/stores/main'
import {createPrompt} from '@/components/PromptInput/use-prompt-input'
const mainStore = useMainStore()

const showInputDialog = ref(true)

const initSerial = async () => {
  try {
    // Serial initialization logic
    let port: any = null
    if (navigator?.serial?.requestPort) {
      port = await navigator.serial.requestPort()
    } else if (navigator?.usb?.requestDevice) {
      // Using polyfill
      const serialPolyfill = await import('web-serial-polyfill')
      const device = await navigator.usb.requestDevice({filters: []})
      port = new (await serialPolyfill).SerialPort(device, {
        usbControlInterfaceClass: 255,
        usbTransferInterfaceClass: 255,
      })
    }
    showInputDialog.value = true
    // Opening port
    await port.open({baudRate: +prompt('baud rate = ', '9600')})
  } catch (error: any) {
    console.error(error)
    mainStore.addNotification({
      type: 'error',
      message: error.message,
    })
  }
}

const testCreatePrompt = async () => {
  const r = await createPrompt('213', 'asd', {
    inputProps: {
      type: 'number',
      min: 0,
      step: 1,
    },
  })
  console.log(r)
}

defineExpose({
  initSerial,
})
</script>

<template>
  <div class="kvm-input flex-row-center-gap" tabindex="-1">
    <button @click="initSerial" class="themed-button">Init Serial</button>
    <button @click="testCreatePrompt" class="themed-button red">showInputDialog</button>
  </div>
</template>

<style scoped lang="scss">
.kvm-input {
}
</style>
