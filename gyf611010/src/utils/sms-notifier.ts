function formatTimestamp(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

function logSMS(phone: string, type: string, content: string): void {
  const timestamp = formatTimestamp(new Date());
  console.log(`[SMS ${timestamp}] 发送至: ${phone}`);
  console.log(`[SMS ${timestamp}] 类型: ${type}`);
  console.log(`[SMS ${timestamp}] 内容: ${content}`);
}

export async function sendTemperatureAlert(
  phone: string,
  wheelNumber: string,
  temperature: number,
  threshold: number
): Promise<boolean> {
  try {
    const diff = temperature - threshold;
    const direction = diff > 0 ? '超过' : '低于';
    const content = `【温度告警】奶酪轮 ${wheelNumber} 当前温度 ${temperature.toFixed(1)}℃，${direction}阈值 ${threshold}℃ ${Math.abs(diff).toFixed(1)}℃，请及时检查！`;

    logSMS(phone, '温度告警', content);

    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

    console.log(`[SMS] 温度告警短信发送成功 -> ${phone}`);
    return true;
  } catch (error) {
    console.error(`[SMS] 温度告警短信发送失败 -> ${phone}:`, error);
    return false;
  }
}

export async function sendForgeryAlert(
  phone: string,
  wheelNumber: string,
  userName: string
): Promise<boolean> {
  try {
    const content = `【安全告警】检测到奶酪轮 ${wheelNumber} 存在数据伪造行为，关联用户: ${userName}，请立即核实处理！`;

    logSMS(phone, '伪造数据告警', content);

    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

    console.log(`[SMS] 伪造数据告警短信发送成功 -> ${phone}`);
    return true;
  } catch (error) {
    console.error(`[SMS] 伪造数据告警短信发送失败 -> ${phone}:`, error);
    return false;
  }
}

export async function sendDataInterruptionAlert(
  phone: string,
  wheelNumber: string
): Promise<boolean> {
  try {
    const content = `【数据中断告警】奶酪轮 ${wheelNumber} 温度数据采集中断，请检查传感器及网络连接！`;

    logSMS(phone, '数据中断告警', content);

    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

    console.log(`[SMS] 数据中断告警短信发送成功 -> ${phone}`);
    return true;
  } catch (error) {
    console.error(`[SMS] 数据中断告警短信发送失败 -> ${phone}:`, error);
    return false;
  }
}
