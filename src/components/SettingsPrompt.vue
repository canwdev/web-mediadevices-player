<script setup lang="ts">
import {ref} from 'vue'
import {useVModel} from '@vueuse/core'
import {useSettingsStore} from '@/stores/settings'
import {onClickOutside} from '@vueuse/core'

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

const rootRef = ref(null)

onClickOutside(rootRef, (event) => {
  mVisible.value = false
})
</script>

<template>
  <transition name="fade">
    <div ref="rootRef" v-if="mVisible" class="settings-prompt panel-blur-bg">
      <button class="btn-close btn-no-style" @click="mVisible = !mVisible">×</button>

      <div class="settings-content" @contextmenu.prevent>
        <code v-if="settingsStore.videoConfig">{{
          `${settingsStore.videoConfig.width}x${settingsStore.videoConfig.height} ${parseFloat((settingsStore.videoConfig.frameRate || 0).toFixed(2))}fps`
        }}</code>

        <label title="Toggle video element controls" class="cursor-pointer">
          <input type="checkbox" v-model="settingsStore.isShowControls" />
          <span>Video Controls</span>
        </label>

        <label title="Fit">
          <span>Fit </span>
          <select style="flex: 1" v-model="settingsStore.fitMode" class="themed-input">
            <option v-for="v in ['contain', 'cover', 'fill', 'none']" :key="v">{{ v }}</option>
          </select>
        </label>

        <div class="cursor-help" title="Filter will not apply to screenshot/record">
          CSS Filter:
        </div>

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
          <input class="themed-input font-code" v-model="settingsStore.inputFilter" />
        </label>
      </div>
    </div>
  </transition>
</template>

<style scoped lang="scss">
.settings-prompt {
  position: fixed;
  top: 8px;
  right: 8px;
  padding: 10px;
  z-index: 100;
  min-width: 150px;

  border-radius: 4px;

  .btn-close {
    position: absolute;
    top: 0;
    right: 0;
    padding: 8px;
    font-size: 20px;
    line-height: 1;
  }

  .settings-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 14px;

    label {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}
</style>
