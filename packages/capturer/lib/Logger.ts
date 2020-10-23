export class Logger {
  constructor(readonly id: string) {}

  private ft(msg: string) {
    const timestamp = new Date().toLocaleString('zh-cn');

    return this.id ? `[${timestamp}][${this.id}] ${msg}` : `[${timestamp}] ${msg}`;
  }

  extend(id: string) {
    return new Logger([this.id, id].join('.'));
  }

  info(msg: string) {
    console.info(this.ft(msg));
  }

  error(msg: string) {
    console.error(this.ft(msg));
  }
}
