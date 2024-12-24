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
  onMounted(() => {
    mouseHider.value = new CursorHider(
      '#app',
      ({el, isShow}) => {
        const actionBarEl = actionBarRef.value
        if (!isShow) {
          el.style.cursor = 'none'
          actionBarEl.classList.remove('visible')
        } else {
          el.style.cursor = ''
          actionBarEl.classList.add('visible')
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
  }
}
