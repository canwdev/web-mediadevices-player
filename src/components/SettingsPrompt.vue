<script setup lang="ts">
import {useVModel} from '@vueuse/core'
import {useSettingsStore} from '@/stores/settings'

const settingsStore = useSettingsStore()
interface Props {
  visible: boolean
}

const emit = defineEmits(['update:visible'])
const props = withDefaults(defineProps<Props>(), {
  visible: false,
})
const mVisible = useVModel(props, 'visible', emit)

const filterOptions = [
  {value: 'grayscale(1)', label: 'Grayscale'},
  {value: 'sepia(1)', label: 'Sepia'},
  {value: 'contrast(3)', label: 'Contrast'},
  {value: 'hue-rotate(90deg)', label: 'Hue rotate'},
  {value: 'blur(10px)', label: 'Blur'},
  {value: 'invert(1)', label: 'Invert'},
  {value: 'brightness(2)', label: 'Brightness'},
]
</script>

<template>
  <div v-if="mVisible" class="settings-prompt">
    <button class="btn-close btn-no-style" @click="mVisible = !mVisible">X</button>

    <div class="settings-content" @contextmenu.prevent>
      <label title="Toggle video element controls" class="cursor-pointer">
        <input type="checkbox" v-model="settingsStore.isShowControls" />
        <span>Video Controls</span>
      </label>

      <div class="cursor-help" title="Filter will not apply to screenshot/record">CSS Filter:</div>

      <label class="cursor-pointer">
        <input type="checkbox" v-model="settingsStore.filterMirrorY" />
        <span>Horizontal Mirror</span>
      </label>

      <label class="cursor-pointer">
        <input type="checkbox" v-model="settingsStore.filterMirrorX" />
        <span>Vertical Mirror</span>
      </label>

      <label class="cursor-pointer">
        <input type="checkbox" v-model="settingsStore.filterShowFg" />
        <span>Pattern</span>
      </label>

      <label
        v-for="option in filterOptions"
        :for="option.label + option.value"
        :key="option.value"
        class="cursor-pointer"
        :title="option.value"
        @contextmenu.prevent="settingsStore.inputFilter += ' ' + option.value"
      >
        <input
          type="checkbox"
          name="filter"
          :id="option.label + option.value"
          :value="option.value"
          v-model="settingsStore.selectedFilters"
          :disabled="!!settingsStore.inputFilter"
        />
        <span>{{ option.label }}</span>
      </label>

      <label>
        <span>filter:</span>
        <input class="themed-button font-code" v-model="settingsStore.inputFilter" />
      </label>
    </div>
  </div>
</template>

<style scoped lang="scss">
.settings-prompt {
  position: fixed;
  top: 8px;
  right: 8px;
  padding: 10px;
  z-index: 100;
  min-width: 150px;

  background: rgba(0, 0, 0, 0.8);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 4px;

  .btn-close {
    position: absolute;
    top: 0;
    right: 0;
    padding: 8px;
  }

  .settings-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 14px;

    label {
      display: flex;
      align-items: center;
      gap: 2px;
    }
  }
}
</style>
