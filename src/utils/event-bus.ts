class EventBus {
  private events: {[key: string]: Function[]} = {}

  // 注册事件监听器
  on(event: string, listener: Function): void {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(listener)
  }

  // 触发事件
  emit(event: string, data?: any): void {
    if (this.events[event]) {
      this.events[event].forEach((listener) => listener(data))
    }
  }

  // 移除事件监听器
  off(event: string, listener: Function): void {
    if (!this.events[event]) return

    this.events[event] = this.events[event].filter((l) => l !== listener)
  }
}

// 导出事件总线实例
export const eventBus = new EventBus()
