import { EventBus } from 'ah-event-bus';
import { FSM } from './lib/FSM';
import { TunnelMsgEvt, ReconnectEvt, StageChangeEvt, TunnelErrorEvt } from './event';
import { BaseDTO, DTOPayload, parseDTO } from './dto';
import { Logger } from 'ah-logger';

export interface IWebsocket {
  onopen: () => any;
  onmessage: (ev: { data: any }) => any;
  onerror: (err: Error) => any;
  onclose: (ev: { code: number; reason: string }) => any;
  close(code?: number, reason?: string): void;
  send(msg: string): void;
}

export interface ITunnelConfig {
  endpoint: string;
  secure: boolean;
  name: string;
  protocol: string;
}

export interface ITunnelAdapter {
  getTunnelToken(meta: { cfg: ITunnelConfig }): Promise<string>;
  getWs(url: string, protocol: string, meta: { cfg: ITunnelConfig }): IWebsocket;
}

export type ITunnelStage =
  | { type: 'init' }
  | { type: 'auth-checking' }
  | { type: 'auth-success'; token: string }
  | { type: 'auth-failed'; err: Error }
  | { type: 'connecting'; url: string; ws: IWebsocket }
  | { type: 'connect-success'; ws: IWebsocket }
  | { type: 'disconnected'; code: number; desc: string };

export class Tunnel extends EventBus {
  constructor(protected readonly cfg: ITunnelConfig, protected readonly adapter: ITunnelAdapter) {
    super();
    this.attachLogger();
  }

  protected sendCnt = 0;

  protected stageError(msg: string) {
    return new Error(`stage error: current=${this.stage.cur.type}, msg=${msg}`);
  }

  protected stage = new FSM<ITunnelStage>({ type: 'init' }, ({ from, to }) =>
    this.emit(new StageChangeEvt(from, to))
  );

  protected attachLogger() {
    const logger = new Logger('Tunnel');

    this.on(StageChangeEvt, ev => {
      let msg = '';

      if (ev.to.type === 'auth-failed') msg = ev.to.err + '';
      if (ev.to.type === 'connecting') msg = ev.to.url;
      if (ev.to.type === 'disconnected') msg = `code=${ev.to.code}, desc=${ev.to.desc}`;

      // 转义控制字符
      msg = msg ? JSON.stringify(msg) : '';

      logger.info(`StageChangeEvt: ${ev.from.type} -> ${ev.to.type}${msg ? ', msg: ' + msg : ''}`);
    })
      .on(TunnelMsgEvt, ev => logger.info(`receive: ${ev.dto.type}\n${ev.dto.sequelize()}`))
      .on(TunnelErrorEvt, ev => logger.error(ev.err.message))
      .on(ReconnectEvt, ev => logger.info(`reconnecting in ${ev.delay}ms`));
  }

  /** 开始连接 */
  connect() {
    if (
      this.stage.cur.type === 'init' ||
      this.stage.cur.type === 'auth-failed' ||
      this.stage.cur.type === 'disconnected'
    ) {
      const reconnect = () => {
        const timeout = 10e3;
        this.emit(new ReconnectEvt(timeout));
        setTimeout(() => this.connect(), timeout);
      };

      this.adapter
        .getTunnelToken({ cfg: this.cfg })
        .then(token => {
          this.stage.transform({ type: 'auth-success', token });

          const wsProtocol = this.cfg.secure ? 'wss' : 'ws';
          const query = new URLSearchParams({
            name: this.cfg.name,
            protocol: this.cfg.protocol,
            token,
          }).toString();

          const url = `${wsProtocol}://${this.cfg.endpoint}/tunnel/client?${query}`;

          // 初始化 ws
          const ws = this.adapter.getWs(url, 'pilib-tunnel', { cfg: this.cfg });

          ws.onopen = () => this.stage.transform({ type: 'connect-success', ws });

          // 转发事件
          ws.onmessage = msg => {
            // FIXME: 现在忽略 binary 类型的数据
            let utf8Data = typeof msg.data === 'string' ? msg.data : undefined;
            if (!utf8Data) return;

            const payload = DTOPayload.fromRaw(utf8Data);
            if (!payload) return;

            this.emit(new TunnelMsgEvt(payload.dto, payload));
          };

          // 如果对方关闭连接，转入 disconnected
          ws.onclose = ev => {
            this.stage.transform({ type: 'disconnected', code: ev.code, desc: ev.reason });
            reconnect();
          };

          ws.onerror = err => this.emit(new TunnelErrorEvt(err));

          this.stage.transform({ type: 'connecting', url, ws });
        })
        .catch(err => {
          this.stage.transform({ type: 'auth-failed', err });
          reconnect();
        });

      this.stage.transform({ type: 'auth-checking' });
      //
    } else {
      throw this.stageError('connect');
    }
  }

  /** 断开连接 */
  disconnect(code: number = 1000, desc: string = 'close') {
    if (this.stage.cur.type === 'connect-success') {
      const { ws } = this.stage.cur;

      // FIXME: 关闭操作可能有要延时等待的地方
      ws.close(code, desc);
      this.stage.transform({ type: 'disconnected', code, desc });
      //
    } else {
      throw this.stageError('disconnect');
    }
  }

  send(dto: BaseDTO) {
    if (this.stage.cur.type === 'connect-success') {
      const { ws } = this.stage.cur;
      const payload = new DTOPayload(dto, { id: this.sendCnt++, timestamp: new Date().valueOf() });
      ws.send(payload.sequelize());
      //
    } else {
      throw this.stageError('send');
    }
  }

  destroy(code?: number, desc?: string) {
    // 断开连接
    this.disconnect(code, desc);

    // 关闭所有监听
    this.off();
  }
}
