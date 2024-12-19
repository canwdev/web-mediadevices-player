import {open} from '@tauri-apps/api/shell'
export const isTauri = !!window.__TAURI__

export const uniOpenUrl = (url: string) => {
  if (isTauri) {
    open(url)
  } else {
    window.open(url)
  }
}
