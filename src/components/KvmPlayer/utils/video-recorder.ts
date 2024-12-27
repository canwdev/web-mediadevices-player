import moment from 'moment/moment'

export class VideoRecorder {
  public videoElement: HTMLVideoElement
  public mediaRecorder: MediaRecorder | null
  private recordedChunks: any[]

  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement
    this.mediaRecorder = null
    this.recordedChunks = []
    console.log('[VideoRecorder]', this)
  }

  start() {
    const stream = this.videoElement.srcObject
    this.mediaRecorder = new MediaRecorder(stream, {
      audioBitsPerSecond: 320000,
      videoBitsPerSecond: 8000000,
      mimeType: 'video/webm',
    })

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data)
      }
    }

    this.mediaRecorder.onstop = () => {
      console.log('record stop', this.mediaRecorder)
      const blob = new Blob(this.recordedChunks, {type: 'video/webm'})
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `record_${moment().format('YYYY-MM-DD_HH-mm-ss')}.webm`
      link.click()
      this.mediaRecorder = null
    }

    this.recordedChunks = []
    this.mediaRecorder.start(10)
    console.log('record start', this.mediaRecorder)
  }

  stop() {
    if (this.mediaRecorder) {
      // 等待1s，防止最后的画面没录上
      setTimeout(() => {
        this.mediaRecorder.stop()
      }, 1000)
    }
  }
}
