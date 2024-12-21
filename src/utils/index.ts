import {open} from '@tauri-apps/api/shell'
export const isTauri = !!window.__TAURI__
import pkg from '../../package.json'

export const uniOpenUrl = (url: string) => {
  if (isTauri) {
    open(url)
  } else {
    window.open(url)
  }
}

export const getVersion = () => {
  return `v${pkg.version}`
}

export const getPkg = () => pkg
