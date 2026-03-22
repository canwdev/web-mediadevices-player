<script setup lang="ts">
import {useVModel, onKeyStroke} from '@vueuse/core'
import {useSettingsStore} from '@/stores/settings'
import {getVersion, uniOpenUrl} from '@/utils'

import {useI18n} from 'vue-i18n'
import {localeList, localeRef} from '@/i18n'

const {t: $t} = useI18n()
const settingsStore = useSettingsStore()
interface Props {
  visible: boolean
  graphInfo?: any
}

const emit = defineEmits(['update:visible'])
const props = withDefaults(defineProps<Props>(), {
  visible: false,
})
const mVisible = useVModel(props, 'visible', emit)

onKeyStroke('Escape', (e) => {
  if (mVisible.value) {
    e.preventDefault()
    mVisible.value = false
  }
})

const filterOptions = [
  {value: 'grayscale(1)', label: $t('app.grayscale')},
  {value: 'sepia(1)', label: $t('app.sepia')},
  {value: 'contrast(3)', label: $t('app.contrast')},
  {value: 'hue-rotate(90deg)', label: $t('app.hue_rotate')},
  {value: 'blur(10px)', label: $t('app.blur')},
  {value: 'invert(1)', label: $t('app.invert')},
  {value: 'brightness(2)', label: $t('app.brightness')},
]

const kvmInputHelp = () => {
  uniOpenUrl('https://github.com/kkocdko/kblog/blob/master/source/toys/webusbkvm/README.md')
}

const showCursorModeTip = () => {
  window.$notification({
    type: 'info',
    html:
      $t('app.linux_and_android_do_not_support') +
      'Ref: <a href="https://www.wch.cn/bbs/thread-83322-1.html" target="_blank">[1]</a> <a href="https://www.wch.cn/bbs/thread-108708-1.html" target="_blank">[2]</a>',
    timeout: 10000,
  })
}

const showKeyboardCompatibleModeTip = () => {
  window.$notification({
    type: 'info',
    html: $t('app.it_is_recommended_to_enable_this'),
    timeout: 10000,
  })
}
</script>

<template>
  <transition name="fade">
    <div class="settings-mask" v-if="mVisible" @click="mVisible = false">
      <div class="settings-prompt panel-blur-bg" @click.stop @keydown.stop @keyup.stop>
        <button class="btn-close btn-no-style" @click="mVisible = !mVisible">×</button>

        <div class="settings-content" @contextmenu.prevent>
          <div class="s-title" style="margin-top: 0">{{ $t('app.video') }}</div>

          <div v-if="settingsStore.videoConfig">
            <code>{{
              `${graphInfo.width}x${graphInfo.height} ${parseFloat((settingsStore.videoConfig.frameRate || 0).toFixed(2))}fps`
            }}</code>
          </div>

          <label :title="$t('app.fit')">
            <span>{{ $t('app.video_fit') }}</span>
            <select style="flex: 1" v-model="settingsStore.fitMode" class="themed-input">
              <option v-for="v in ['contain', 'fill', 'cover', 'none']" :key="v">{{ v }}</option>
            </select>
          </label>

          <!--<label title="Toggle video element controls" class="cursor-pointer">-->
          <!--  <input type="checkbox" v-model="settingsStore.isShowControls" />-->
          <!--  <span>Video Controls UI</span>-->
          <!--</label>-->

          <label class="cursor-pointer">
            <input type="checkbox" v-model="settingsStore.floatUI" />
            <span>{{ $t('app.float_ui') }}</span>
          </label>

          <div class="s-title">{{ $t('app.kvm_settings') }}</div>

          <label class="cursor-pointer">
            <input type="checkbox" v-model="settingsStore.enableKvmInput" />
            <span>{{ $t('app.enable_kvm_input') }}</span>
            <a href="javascript:" @click="kvmInputHelp">[CH9329 ?]</a>
          </label>

          <template v-if="settingsStore.enableKvmInput">
            <label>
              <span>{{ $t('app.baud_rate') }}</span>
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
              <input type="checkbox" v-model="settingsStore.keyboardCompatibleMode" />
              <span
                >{{ $t('app.keyboard_compatible_mode')
                }}<a href="javascript:" @click="showKeyboardCompatibleModeTip">[?]</a></span
              >
            </label>
            <label>
              <span
                >{{ $t('app.cursor_mode')
                }}<a href="javascript:" @click="showCursorModeTip">[?]</a></span
              >

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
                  :placeholder="$t('app.width')"
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
                  :placeholder="$t('app.height')"
                />%
              </label>
            </div>
          </template>

          <div class="s-title cursor-help" :title="$t('app.filter_will_not_apply_to_screens')">
            {{ $t('app.css_filter') }}
          </div>

          <label class="cursor-pointer">
            <input type="checkbox" v-model="settingsStore.filterMirrorY" />
            <span>{{ $t('app.horizontal_mirror') }}</span>
          </label>

          <label class="cursor-pointer">
            <input type="checkbox" v-model="settingsStore.filterMirrorX" />
            <span>{{ $t('app.vertical_mirror') }}</span>
          </label>

          <label class="cursor-pointer">
            <input type="checkbox" v-model="settingsStore.filterShowFg" />
            <span>{{ $t('app.pattern') }}</span>
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
              :placeholder="$t('app.css_filter_code')"
            />
          </label>

          <div class="s-title">{{ $t('app.about') }}</div>

          <label>
            <span>Language</span>
            <select style="flex: 1" v-model="localeRef" class="themed-input">
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
}
</style>
