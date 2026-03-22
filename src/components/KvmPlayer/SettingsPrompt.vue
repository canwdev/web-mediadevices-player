<script setup lang="ts">
import { onKeyStroke, useVModel } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { localeList, localeRef } from '@/i18n'
import { useSettingsStore } from '@/stores/settings'
import { getVersion, uniOpenUrl } from '@/utils'

const props = withDefaults(defineProps<Props>(), {
  visible: false,
})
const emit = defineEmits(['update:visible'])
const { t: $t } = useI18n()
const settingsStore = useSettingsStore()
interface Props {
  visible: boolean
  graphInfo?: any
}

const mVisible = useVModel(props, 'visible', emit)

onKeyStroke('Escape', (e) => {
  if (mVisible.value) {
    e.preventDefault()
    mVisible.value = false
  }
})

const filterOptions = computed(() => [
  { value: 'grayscale(1)', label: $t('app.grayscale') },
  { value: 'sepia(1)', label: $t('app.sepia') },
  { value: 'contrast(3)', label: $t('app.contrast') },
  { value: 'hue-rotate(90deg)', label: $t('app.hue_rotate') },
  { value: 'blur(10px)', label: $t('app.blur') },
  { value: 'invert(1)', label: $t('app.invert') },
  { value: 'brightness(2)', label: $t('app.brightness') },
])

function kvmInputHelp() {
  uniOpenUrl('https://github.com/kkocdko/kblog/blob/master/source/toys/webusbkvm/README.md')
}
function showTips(html: string) {
  window.$notification({
    type: 'info',
    html,
    timeout: 10000,
  })
}
function showCursorModeTip() {
  showTips(
    `${$t('app.linux_and_android_do_not_support')
    }Ref: <a href="https://www.wch.cn/bbs/thread-83322-1.html" target="_blank">[1]</a> <a href="https://www.wch.cn/bbs/thread-108708-1.html" target="_blank">[2]</a>`,
  )
}
</script>

<template>
  <transition name="fade">
    <div v-if="mVisible" class="settings-mask" @click="mVisible = false">
      <div class="settings-prompt panel-blur-bg" @click.stop @keydown.stop @keyup.stop>
        <button class="btn-close btn-no-style" @click="mVisible = !mVisible">
          ×
        </button>

        <div class="settings-content" @contextmenu.prevent>
          <div class="s-title" style="margin-top: 0">
            {{ $t('app.video') }}
          </div>

          <div v-if="settingsStore.videoConfig">
            <code>{{
              `${graphInfo.width}x${graphInfo.height} ${parseFloat((settingsStore.videoConfig.frameRate || 0).toFixed(2))}fps`
            }}</code>
          </div>

          <label :title="$t('app.fit')">
            <span>{{ $t('app.video_fit') }}</span>
            <select v-model="settingsStore.fitMode" style="flex: 1" class="themed-input">
              <option v-for="v in ['contain', 'fill', 'cover', 'none']" :key="v">{{ v }}</option>
            </select>
          </label>
          <div v-if="settingsStore.videoConfig" class="control-flex-group">
            <label>
              <span>W</span>
              <input v-model="settingsStore.videoConfig.width" type="number" class="themed-input">
            </label>
            <label>
              <span>H</span>
              <input v-model="settingsStore.videoConfig.height" type="number" class="themed-input">
            </label>
            <label>
              <span>FPS</span>
              <input v-model="settingsStore.videoConfig.frameRate" type="number" class="themed-input">
            </label>
          </div>

          <label class="cursor-pointer">
            <input v-model="settingsStore.floatUI" type="checkbox">
            <span>{{ $t('app.float_ui') }}</span>
          </label>

          <div class="s-title">
            {{ $t('app.kvm_settings') }}
          </div>

          <label class="cursor-pointer">
            <input v-model="settingsStore.enableKvmInput" type="checkbox">
            <span>{{ $t('app.enable_kvm_input') }}</span>
            <a href="javascript:" @click="kvmInputHelp">[CH9329 ?]</a>
          </label>

          <template v-if="settingsStore.enableKvmInput">
            <label class="cursor-pointer">
              <input v-model="settingsStore.autoConnectKvm" type="checkbox">
              <span>{{ $t('app.auto_connect_kvm') }}</span>
            </label>
            <label>
              <span>{{ $t('app.baud_rate') }}</span>
              <select v-model="settingsStore.baudRate" style="flex: 1" class="themed-input">
                <option
                  v-for="v in [1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200]"
                  :key="v"
                  :value="`${v}`"
                >
                  {{ v }}
                </option>
              </select>
            </label>
            <label>
              <input v-model="settingsStore.keyboardCompatibleMode" type="checkbox">
              <span>{{ $t('app.keyboard_compatible_mode')
              }}<a
                href="javascript:"
                @click="showTips($t('app.it_is_recommended_to_enable_this'))"
              >[?]</a></span>
            </label>
            <label>
              <span>{{ $t('app.cursor_mode')
              }}<a href="javascript:" @click="showCursorModeTip">[?]</a></span>

              <select v-model="settingsStore.cursorMode" style="flex: 1" class="themed-input">
                <option v-for="v in ['relative', 'absolute']" :key="v">{{ v }}</option>
              </select>
            </label>

            <label v-if="settingsStore.cursorMode === 'relative'">
              <span>
                {{ $t('app.unlock_mouse_mode') }}
                <a a href="javascript:" @click="showTips($t('app.unlock_mouse_mode_tips'))">[?]</a>
              </span>

              <select v-model="settingsStore.unlockMouseMode" style="flex: 1" class="themed-input">
                <option value="disabled">{{ $t('app.unlock_mouse_mode_disabled') }}</option>
                <option value="ctrl_alt">{{ $t('app.unlock_mouse_mode_ctrl_alt') }}</option>
                <option value="right_ctrl">{{ $t('app.unlock_mouse_mode_right_ctrl') }}</option>
              </select>
            </label>

            <div v-if="settingsStore.cursorMode === 'absolute'" class="flex-row-center-gap">
              <label>
                W:
                <input
                  v-model="settingsStore.absMouseAreaWidth"
                  class="themed-input"
                  type="number"
                  step="0.4"
                  :min="0"
                  :max="100"
                  :placeholder="$t('app.width')"
                >%
              </label>
              <label>
                H:
                <input
                  v-model="settingsStore.absMouseAreaHeight"
                  class="themed-input"
                  type="number"
                  step="0.4"
                  :min="0"
                  :max="100"
                  :placeholder="$t('app.height')"
                >%
              </label>
            </div>
          </template>

          <div class="s-title cursor-he">
            {{ $t('app.css_filter') }}
            <a a href="javascript:" @click="showTips($t('app.filter_will_not_apply_to_screens'))">[?]</a>
          </div>

          <div class="control-flex-group">
            <label class="cursor-pointer">
              <input v-model="settingsStore.filterMirrorY" type="checkbox">
              <span>{{ $t('app.horizontal_mirror') }}</span>
            </label>

            <label class="cursor-pointer">
              <input v-model="settingsStore.filterMirrorX" type="checkbox">
              <span>{{ $t('app.vertical_mirror') }}</span>
            </label>

            <label class="cursor-pointer">
              <input v-model="settingsStore.filterShowFg" type="checkbox">
              <span>{{ $t('app.pattern') }}</span>
            </label>

            <label
              v-for="option in filterOptions"
              :key="option.value"
              :for="option.label + option.value"
              class="cursor-pointer"
              style="font-style: italic; font-weight: 500"
              :title="option.value"
              @contextmenu.prevent="settingsStore.inputFilter += ` ${option.value}`"
            >
              <input
                :id="option.label + option.value"
                v-model="settingsStore.selectedFilters"
                type="checkbox"
                name="filter"
                :value="option.value"
                :disabled="!!settingsStore.inputFilter"
              >
              <span>{{ option.label }}</span>
            </label>
          </div>
          <label style="font-style: italic; font-weight: 500">
            <span>filter:</span>
            <input
              v-model="settingsStore.inputFilter"
              class="themed-input font-code"
              :placeholder="$t('app.css_filter_code')"
            >
          </label>

          <div class="s-title">
            {{ $t('app.about') }}
          </div>

          <label>
            <span>Language</span>
            <select v-model="localeRef" style="flex: 1" class="themed-input">
              <option v-for="v in localeList" :key="v.value" :value="v.value">{{ v.label }}</option>
            </select>
          </label>

          <label>
            <span>{{ $t('app.version') }}:</span>
            {{ getVersion() }}
          </label>

          <label>
            <span>{{ $t('app.author') }}: Canwdev</span>
            <a
              href="javascript:void(0);"
              @click="uniOpenUrl('https://github.com/canwdev/web-mediadevices-player')"
            >
              [Github]
            </a>
          </label>
        </div>
      </div>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
.settings-mask {
  position: fixed;
  inset: 0;
  z-index: 100;
}

.settings-prompt {
  position: fixed;
  top: 40px;
  left: 50%;
  padding: 10px;
  z-index: 100;
  min-width: 150px;
  max-height: 90vh;
  overflow-y: auto;
  scrollbar-width: thin;
  border-radius: 4px;

  @media screen and (max-width: 500px) {
    left: unset;
    right: 0;
  }

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

    a {
      color: #4caf50;
    }
  }

  .control-flex-group {
    display: flex;
    flex-wrap: wrap;
    max-width: 250px;
    gap: 6px;
    label {
      gap: 2px;
    }
    input[type="number"] {
      width: 60px;
    }
  }
}
</style>
