import { ref, watch } from 'vue'

export const useLocalStorageBoolean = (key, defaultValue = false) => {
  const updateInitValue = () =>
    defaultValue ? !localStorage.getItem(key) : Boolean(localStorage.getItem(key))

  const val = ref(updateInitValue())

  watch(val, (val) => {
    if (!defaultValue) {
      val = !val
    }
    if (val) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, '1')
    }
  })

  return val
}

// https://github.com/canwdev/page-craft-vite/blob/master/src/hooks/use-local-storage.ts
export const useLocalStorageString = (key, defaultValue = '') => {
  const val = ref(localStorage.getItem(key) || defaultValue)
  watch(val, (val) => {
    if (val) {
      localStorage.setItem(key, val)
    } else {
      localStorage.removeItem(key)
    }
  })
  return val
}

export const useLocalStorageNumber = (key, defaultValue = 0) => {
  const val = ref(Number(localStorage.getItem(key)) || defaultValue)
  watch(val, (val) => {
    if (val) {
      localStorage.setItem(key, String(val))
    } else {
      localStorage.removeItem(key)
    }
  })
  return val
}

export const useLocalStorageObject = (key, defaultValue = {}) => {
  const val = ref(JSON.parse(localStorage.getItem(key) || 'null') || defaultValue)
  watch(val, (val) => {
    if (val) {
      localStorage.setItem(key, JSON.stringify(val))
    } else {
      localStorage.removeItem(key)
    }
  })
  return val
}
