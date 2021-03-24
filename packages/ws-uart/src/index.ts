import { server as WebSocketServer } from 'websocket';
import * as http from 'http';
import * as SerialPort from 'serialport';
import { Logger } from './Logger';

function buf2Hex(buf: Buffer): string {
  const hexList: string[] = [];
  buf.forEach(b => hexList.push('0x' + b.toString(16)));
  return `<${hexList.join(',')}>`;
}

export const startRpiWsUart = (cfg: { port: number; uart: { com: string; baudRate: number } }) => {
  const logger = new Logger().setName('RpiWsUart');

  logger.info(`config:\n${JSON.stringify(cfg, null, 2)}`);

  const server = http.createServer((_, response) => {
    response.writeHead(404);
    response.end();
  });

  const ws = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false,
  });

  const uart = new SerialPort(cfg.uart.com, {
    baudRate: cfg.uart.baudRate,
    autoOpen: false,
  });

  server.listen(cfg.port, () => {
    logger.info(`listening on ${cfg.port}`);
  });

  // ws 请求连接
  ws.on('request', wsReq => {
    if (uart.isOpen) {
      logger.info('uart busy, reject ws');
      wsReq.reject(409, '串口忙');
      return;
    }

    const conn = wsReq.accept();
    logger.info(`ws connected: ${conn.remoteAddress}`);

    // 连接进来的时候，打开串口
    uart.open(err => {
      if (err) {
        // 串口打开失败，关闭 ws
        logger.error(`uart open error: ${err.message}`);
        ws.closeAllConnections();
        return;
      }

      logger.info('uart opened');

      uart.on('data', (buf: Buffer) => {
        logger.info(`[uart => ws] ${buf2Hex(buf)}`);
        // uart => ws
        conn.sendBytes(buf);
      });

      uart.on('error', err => {
        logger.error(`uart error: ${err}`);
      });

      conn.on('message', msg => {
        const buf =
          msg.type === 'utf8'
            ? Buffer.from(msg.utf8Data!, 'utf-8')
            : msg.type === 'binary'
            ? msg.binaryData
            : undefined;

        // ws => uart
        if (buf) {
          logger.info(`[ws => uart] ${buf2Hex(buf)}`);
          uart.write(buf);
        }
      });

      conn.on('close', (code, desc) => {
        logger.info(`ws close: <${code}>${desc}`);
        // ws 断开的时候，关闭串口
        uart.close();
      });
    });
  });

  /** 优雅退出 */
  const shutdown = () => {
    uart.close();
    ws.shutDown();
    server.close();
    logger.info('shutdown');
  };

  return { shutdown };
};
