function formatDate(fmt: string, date = new Date()): string {
  const o: any = {
    'M+': date.getMonth() + 1, //月份
    'D+': date.getDate(), //日
    'H+': date.getHours(), //小时
    'm+': date.getMinutes(), //分
    's+': date.getSeconds(), //秒
    'q+': Math.floor((date.getMonth() + 3) / 3), //季度
    S: date.getMilliseconds(), //毫秒
  };

  if (/(Y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
  }

  for (var k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
      );
    }
  }

  return fmt;
}

export class Logger {
  private name = 'APP';

  setName(name: string) {
    this.name = name;
    return this;
  }

  private ft(level: string, msg: string) {
    const timestamp = formatDate('YYYY-MM-DD HH:mm:ss.S');
    return `[${timestamp}|${this.name}|${level}] ${msg}`;
  }

  extend(subName: string): Logger {
    const newName = [this.name, subName].join('.');
    return new Logger().setName(newName);
  }

  info(msg: string) {
    console.info(this.ft('INFO', msg));
  }

  error(msg: string) {
    console.error(this.ft('ERROR', msg));
  }
}
