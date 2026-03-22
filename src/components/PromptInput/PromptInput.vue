<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    value: string
    modelValue?: boolean
    closeOnClickOutside?: boolean
    type: 'input' | 'textarea'
    inputProps?: any
    validator?: (value: string) => any
  }>(),
  {
    value: '',
    modelValue: false,
    closeOnClickOutside: false,
  },
)
const emit = defineEmits(['confirm', 'cancel', 'update:modelValue'])
const mVisible = useVModel(props, 'modelValue', emit)

const formRef = ref()
const inputRef = ref()
const inputText = ref(props.value)
watch(mVisible, (val) => {
  if (val) {
    setTimeout(() => {
      inputRef.value.focus()
    })
  }
  else {
    emit('cancel')
  }
})

async function handleConfirm() {
  if (props.validator) {
    const error = await props.validator(inputText.value)
    if (error) {
      throw new Error(error)
    }
  }
  emit('confirm', inputText.value)
  mVisible.value = false
}

function handleOutsideClick() {
  if (props.closeOnClickOutside) {
    mVisible.value = false
  }
}
</script>

<template>
  <transition name="fade">
    <div v-if="mVisible" class="popup-window" @keydown.stop @keyup.stop @click="handleOutsideClick">
      <form ref="formRef" class="popup-content panel-blur-bg" @submit.prevent="handleConfirm" @click.stop>
        <div v-if="title" class="popup-title">
          {{ title }}
        </div>

        <textarea
          v-if="type === 'textarea'" ref="inputRef" v-bind="inputProps" v-model="inputText" class="themed-input"
          required
        />
        <input v-else ref="inputRef" v-bind="inputProps" v-model="inputText" class="themed-input" required>

        <div class="flex-row-center-gap">
          <button class="themed-button blue" type="submit">
            OK
          </button>
          <button type="button" class="themed-button" @click="mVisible = false">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </transition>
</template>

<style scoped lang="scss">
.popup-window {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  padding: 20px;
  z-index: 2000;

  .popup-content {
    padding: 10px;
    border-radius: 5px;
    width: fit-content;
    min-width: 250px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .popup-title {}

    input,
    button {
      height: 30px;
      padding-left: 10px;
      padding-right: 10px;
    }

    .flex-row-center-gap {
      justify-content: flex-end;
    }
  }
}
</style>
