/**
 * CH9329芯片串口通信协议
 * https://www.wch.cn/products/ch9329.html
 * https://www.wch.cn/downloads/CH9329EVT_ZIP.html
 */
export enum CmdType {
  // 获取芯片版本等信息
  CMD_GET_INFO = 0x01,
  // 发送USB键盘普通数据
  CMD_SEND_KB_GENERAL_DATA = 0x02,
  // 发送USB键盘媒体数据
  CMD_SEND_KB_MEDIA_DATA = 0x03,
  // 发送USB绝对鼠标数据
  CMD_SEND_MS_ABS_DATA = 0x04,
  // 发送USB相对鼠标数据
  CMD_SEND_MS_REL_DATA = 0x05,
  // 发送USB自定义HID设备数据
  CMD_SEND_MY_HID_DATA = 0x06,
  // 读取USB自定义HID设备数据
  CMD_READ_MY_HID_DATA = 0x87,
  // 获取参数配置
  CMD_GET_PARA_CFG = 0x08,
  // 设置参数配置
  CMD_SET_PARA_CFG = 0x09,
  // 获取字符串描述信息
  CMD_GET_USB_STRING = 0x0a,
  // 设置字符串描述符配置
  CMD_SET_USB_STRING = 0x0b,
  // 恢复出厂默认配置
  CMD_SET_DEFAULT_CFG = 0x0c,
  // 复位芯片
  CMD_RESET = 0x0f,
}

export const genPacket = (cmd: CmdType, ...data: any[]) => {
  // console.log(data)
  for (const v of data) if (v < 0 || v > 0xff) throw v
  const ret = [
    // 帧头：占 2 个字节，固定为 0x57、0xAB
    0x57,
    0xab,
    // 地址码：占 1 个字节，默认为 0x00
    0x00,
    // 命令码
    cmd,
    // 后续数据长度
    data.length,
    // 后续数据
    ...data,
  ]

  // 累加和：占 1 个字节，计算方式为： SUM = HEAD+ADDR+CMD+LEN+DATA。
  const sum = new Uint8Array([0])
  for (const v of ret) sum[0] += v
  ret.push(sum[0])
  return ret
}

// clamp to int8
export const i8clamp = (v: number) => Math.max(-0x7f, Math.min(v, 0x7f))

// 分解一个十六进制数为低字节和高字节，低字节在前，高字节在后
export const decomposeHexToBytes = (hexNumber: number) => {
  // 确保输入是一个有效的十六进制数
  // if (typeof hexNumber !== 'number' || hexNumber < 0 || hexNumber > 0xFFFF) {
  //   throw new Error('请输入一个有效的16进制数（0到0xFFFF之间）');
  // }

  // 获取低字节（最后8位）
  const lowByte = hexNumber & 0xff

  // 获取高字节（前8位）
  const highByte = (hexNumber >> 8) & 0xff

  return [lowByte, highByte]
}
