import { open } from '@tauri-apps/api/shell'
import pkg from '../../package.json'

export const isTauri = !!window.__TAURI__

export function uniOpenUrl(url: string) {
  if (isTauri) {
    open(url)
  }
  else {
    window.open(url)
  }
}

export function getVersion() {
  return `v${pkg.version}`
}

export const getPkg = () => pkg
