export class Logger {
  constructor(readonly id: string) {}

  private ft(level: string, msg: string) {
    const timestamp = new Date().toLocaleString('zh-cn');

    return `[${timestamp}][${this.id}][${level}] ${msg}`;
  }

  extend(subId: string) {
    return new Logger([this.id, subId].join('.'));
  }

  info(msg: string) {
    console.info(this.ft('INFO', msg));
  }

  error(msg: string) {
    console.error(this.ft('ERROR', msg));
  }
}
