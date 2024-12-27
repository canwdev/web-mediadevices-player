import {onBeforeUnmount, onMounted, ref, shallowRef, watch} from 'vue'
import {useSettingsStore} from '@/stores/settings'
import {CursorHider} from '@/components/KvmPlayer/utils/cursor-hider'
import {useStorage} from '@vueuse/core'

export const useActionBar = () => {
  const mouseHider = shallowRef()
  const actionBarRef = shallowRef()
  const settingsStore = useSettingsStore()

  const isShowFloatBar = useStorage('wmd__is_show_float_bar', true)

  watch(
    () => settingsStore.enableKvmInput,
    (val) => {
      if (mouseHider.value) {
        if (!val) {
          mouseHider.value.start()
        } else {
          mouseHider.value.stop()
        }
      }
    },
  )

  // 是否在非KVM模式下展示控制条
  const isShowFloatBarInNonKvmMode = ref(false)

  onMounted(() => {
    mouseHider.value = new CursorHider(
      '#app',
      ({el, isShow}) => {
        if (!isShow) {
          el.style.cursor = 'none'
          isShowFloatBarInNonKvmMode.value = false
        } else {
          el.style.cursor = ''
          isShowFloatBarInNonKvmMode.value = true
        }
      },
      3000,
    )
    if (settingsStore.enableKvmInput) {
      mouseHider.value.stop()
    }
  })

  onBeforeUnmount(() => {
    if (mouseHider.value) {
      mouseHider.value.stop()
    }
  })
  return {
    actionBarRef,
    mouseHider,
    isShowFloatBar,
    isShowFloatBarInNonKvmMode,
  }
}
