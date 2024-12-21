export function snapVideoImage(video: HTMLVideoElement) {
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d')!.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)

  // 将 canvas 转换为 png 格式并保存
  return canvas.toDataURL('image/png')
}

export const downloadUrl = (url: string, filename?) => {
  // 创建一个虚拟的 <a> 标签
  const a = document.createElement('a')
  // 设置 href 为文件的 URL
  a.href = url
  // 设置 download 属性，以指定下载时的文件名
  a.download = filename
  // 将 <a> 标签添加到 DOM 中
  document.body.appendChild(a)
  // 模拟点击 <a> 标签以触发下载
  a.click()
  // 点击后移除 <a> 标签
  document.body.removeChild(a)
}

/**
 * 复制字符串到剪贴板操作（兼容新旧接口）
 * @param text 要复制的文本
 */
export const copyToClipboard = (text): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 如果支持 Clipboard API，就使用它
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          resolve()
        })
        .catch((error) => {
          reject(error)
        })
    } else {
      // 使用 document.execCommand 兼容旧 API
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.display = 'none'
      document.body.appendChild(textarea)
      textarea.select()

      try {
        const success = document.execCommand('copy')
        if (!success) {
          throw new Error('Unable to perform copy operation')
        } else {
          resolve()
        }
      } catch (error) {
        reject(error)
      } finally {
        document.body.removeChild(textarea)
      }
    }
  })
}

export const copy = async (val, isShowVal = true) => {
  if (!val) {
    return
  }
  if (typeof val === 'object') {
    if (isShowVal) {
      console.info('object', val)
    }
    val = JSON.stringify(val, null, 2)
  }
  if (isShowVal) {
    console.info('copy:', val)
  }
  await copyToClipboard(val)
  let showVal = ''
  if (isShowVal) {
    if (val.length > 350) {
      showVal = val.slice(0, 350) + '...'
    } else {
      showVal = val
    }
  }
  if (showVal) {
    showVal = ': ' + showVal
  }
  window.$notification({
    type: 'success',
    message: `Copied${showVal}`,
    timeout: 5000,
  })
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
