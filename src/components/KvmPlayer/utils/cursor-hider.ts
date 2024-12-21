type showHideFnType = (arg0: {el: HTMLElement; isShow: boolean}) => void

// 鼠标自动隐藏工具
export class CursorHider {
  private timeoutID: any
  private targetEl: HTMLElement
  private showHideFn: showHideFnType
  private time: number

  constructor(cursorSelector: string, showHideFn: showHideFnType, time = 1000) {
    this.timeoutID = null
    this.targetEl = document.querySelector(cursorSelector)!
    this.showHideFn = showHideFn
    this.time = time
    this.showCursor = this.showCursor.bind(this)
    this.handlePointerLockChange = this.handlePointerLockChange.bind(this)

    this.start()
  }

  hideCursor() {
    if (typeof this.showHideFn === 'function') {
      this.showHideFn({el: this.targetEl, isShow: false})
    } else {
      this.targetEl.style.cursor = 'none'
    }
  }

  showCursor() {
    if (document.pointerLockElement) {
      // ignore lock
      return
    }

    if (typeof this.showHideFn === 'function') {
      this.showHideFn({el: this.targetEl, isShow: true})
    } else {
      this.targetEl.style.cursor = ''
    }
    this.runTimer()
  }

  runTimer() {
    clearTimeout(this.timeoutID)
    this.timeoutID = setTimeout(() => {
      this.hideCursor()
    }, this.time)
  }

  handlePointerLockChange() {
    if (!document.pointerLockElement) {
      // console.log('Exit pointer lock')
    } else {
      this.hideCursor()
    }
  }

  start() {
    document.addEventListener('pointerlockchange', this.handlePointerLockChange)
    document.addEventListener('mousemove', this.showCursor)
    this.runTimer()
  }

  stop() {
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange)
    document.removeEventListener('mousemove', this.showCursor)
    clearTimeout(this.timeoutID)
    this.showHideFn({el: this.targetEl, isShow: true})
  }
}
