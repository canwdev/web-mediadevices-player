import {ref, createApp, h} from 'vue'
import PromptInput from './PromptInput.vue'

export const createPrompt = async (
  initValue: string,
  title: string,
  props: any = {},
): Promise<string | null> => {
  return new Promise((resolve) => {
    const isVisible = ref(false)
    const app = createApp({
      setup() {
        const handleConfirm = (value: string) => {
          resolve(value)
          destroyPopup()
        }

        const handleCancel = () => {
          resolve(null)
          setTimeout(() => {
            destroyPopup()
          }, 310)
        }

        // 使用 render 函数代替 TSX
        return () => {
          return h(PromptInput, {
            value: initValue,
            title,
            modelValue: isVisible.value,
            'onUpdate:modelValue': (value: boolean) => {
              isVisible.value = value
            },
            onConfirm: handleConfirm,
            onCancel: handleCancel,
            ...props,
          })
        }
      },
    })

    const popupContainer = document.createElement('div')
    document.body.appendChild(popupContainer)
    app.mount(popupContainer)
    isVisible.value = true

    const destroyPopup = () => {
      app.unmount()
      document.body.removeChild(popupContainer)
    }
  })
}
