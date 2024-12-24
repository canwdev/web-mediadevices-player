<script setup lang="ts">
import {ref, watch} from 'vue'
import {useVModel} from '@vueuse/core'
import {useSettingsStore} from '@/stores/settings'
import {onClickOutside} from '@vueuse/core'
import {getVersion, uniOpenUrl} from '@/utils'

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

watch(
  () => settingsStore.cursorMode,
  (val) => {
    if (val === 'absolute') {
      settingsStore.floatUI = false
    }
  },
)

const kvmInputHelp = () => {
  uniOpenUrl('https://github.com/kkocdko/kblog/blob/master/source/toys/webusbkvm/README.md')
}
</script>

<template>
  <transition name="fade">
    <div
      ref="rootRef"
      v-if="mVisible"
      class="settings-prompt panel-blur-bg"
      @keydown.stop
      @keyup.stop
    >
      <button class="btn-close btn-no-style" @click="mVisible = !mVisible">×</button>

      <div class="settings-content" @contextmenu.prevent>
        <div class="s-title" style="margin-top: 0">Video</div>

        <code v-if="settingsStore.videoConfig">{{
          `${settingsStore.videoConfig.width}x${settingsStore.videoConfig.height} ${parseFloat((settingsStore.videoConfig.frameRate || 0).toFixed(2))}fps`
        }}</code>

        <label title="Fit">
          <span>Fit </span>
          <select style="flex: 1" v-model="settingsStore.fitMode" class="themed-input">
            <option v-for="v in ['contain', 'cover', 'fill', 'none']" :key="v">{{ v }}</option>
          </select>
        </label>

        <label title="Toggle video element controls" class="cursor-pointer">
          <input type="checkbox" v-model="settingsStore.isShowControls" />
          <span>Video Controls UI</span>
        </label>

        <label class="cursor-pointer">
          <input type="checkbox" v-model="settingsStore.floatUI" />
          <span>Float UI</span>
        </label>

        <div class="s-title">KVM Settings</div>

        <label class="cursor-pointer">
          <input type="checkbox" v-model="settingsStore.enableKvmInput" />
          <span>Enable KVM Input</span>
          <button @click="kvmInputHelp" class="themed-button">CH340+CH9329 ❓</button>
        </label>

        <template v-if="settingsStore.enableKvmInput">
          <label>
            <span>Baud Rate</span>
            <select style="flex: 1" v-model="settingsStore.baudRate" class="themed-input">
              <option
                v-for="v in [1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200]"
                :key="v"
                :value="v + ''"
              >
                {{ v }}
              </option>
            </select>
          </label>
          <label>
            <span>Cursor Mode</span>

            <select style="flex: 1" v-model="settingsStore.cursorMode" class="themed-input">
              <option v-for="v in ['relative', 'absolute']" :key="v">{{ v }}</option>
            </select>
          </label>

          <div class="flex-row-center-gap" v-if="settingsStore.cursorMode === 'absolute'">
            <label>
              W:
              <input
                class="themed-input"
                type="number"
                step="0.4"
                v-model="settingsStore.absMouseAreaWidth"
                :min="0"
                :max="100"
                placeholder="Width %"
              />%
            </label>
            <label>
              H:
              <input
                class="themed-input"
                type="number"
                step="0.4"
                v-model="settingsStore.absMouseAreaHeight"
                :min="0"
                :max="100"
                placeholder="Height %"
              />%
            </label>
          </div>
        </template>

        <div class="s-title cursor-help" title="Filter will not apply to screenshot/record">
          CSS Filter
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
          style="font-style: italic; font-weight: 500"
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

        <label style="font-style: italic; font-weight: 500">
          <span>filter:</span>
          <input
            class="themed-input font-code"
            v-model="settingsStore.inputFilter"
            placeholder="CSS Filter Code"
          />
        </label>

        <div class="s-title">About</div>

        <label>
          <span>Version:</span>
          {{ getVersion() }}
        </label>

        <label>
          <span>Author: Canwdev</span>
          <button
            class="themed-button green"
            @click="uniOpenUrl('https://github.com/canwdev/web-mediadevices-player')"
          >
            Github
          </button>
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
  max-height: 90vh;
  overflow-y: auto;
  scrollbar-width: thin;

  border-radius: 4px;

  .btn-close {
    position: absolute;
    top: 0;
    right: 0;
    padding: 2px 4px;
    font-size: 20px;
    line-height: 1;
  }

  .settings-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 14px;

    .s-title {
      font-weight: bold;
      margin-top: 10px;
      padding: 2px 6px;
      background: linear-gradient(to right, rgba(239, 239, 239, 0.43), transparent);
      border-radius: 2px;
    }

    label {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}
</style>
