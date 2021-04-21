import * as pty from 'node-pty';
import { client as WebSocketClient } from 'websocket';
import { Logger } from 'ah-logger';
import { IConfig } from './config';

export const start = ({ endpoint }: IConfig) => {
  const _appLogger = new Logger('RTC');
  const logger = {
    app: _appLogger,
    ws: _appLogger.extend('WS'),
    pty: _appLogger.extend('PTY'),
  };

  const ws = new WebSocketClient();

  ws.on('connect', conn => {
    logger.ws.info(`connected at ${conn.remoteAddress}`);

    const ptyIns = pty.spawn('bash', [], {
      name: 'xterm-color',
      cwd: process.env.HOME,
      env: process.env as any,
    });

    logger.pty.info(`pty spawned: pid=${ptyIns.pid}`);

    ptyIns.onData(d => {
      logger.pty.info(`onData: \n${JSON.stringify(d.slice(0, 80)) + '...'}`);

      conn.sendUTF(d, err => {
        if (err) logger.ws.error(`sendUTF error: ${err}`);
      });
    });

    ptyIns.onExit(e => logger.pty.error(`onExit: exitCode=${e.exitCode}, signal=${e.signal}`));

    conn.on('message', d => {
      const msg = d.type === 'utf8' ? d.utf8Data : undefined;
      if (!msg) return logger.ws.error(`not support message type: ${d.type}`);

      logger.pty.info(`write ${JSON.stringify(msg)}`);
      ptyIns.write(msg);
    });
  });

  ws.on('connectFailed', err => logger.ws.error(`connect failed: ${err}`));

  const url = `${endpoint}?token=455508aa9e65baec&name=rpi1`;
  ws.connect(url, 'pilib', undefined);
};
