import { EventBus } from 'ah-event-bus';
import { FSM } from './lib/FSM';
import { TunnelMsgEvt, ReconnectEvt, StageChangeEvt, TunnelErrorEvt } from './event';
import { BaseDTO, parseDTO } from './dto';

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

export type ITunnelStage =
  | { type: 'init' }
  | { type: 'auth-checking' }
  | { type: 'auth-success'; token: string }
  | { type: 'auth-failed'; err: Error }
  | { type: 'connecting'; url: string; ws: IWebsocket }
  | { type: 'connect-success'; ws: IWebsocket }
  | { type: 'disconnected'; code: number; desc: string };

export abstract class Tunnel extends EventBus {
  constructor(protected readonly cfg: ITunnelConfig) {
    super();
  }

  abstract getTunnelToken(): Promise<string>;
  abstract getWs(url: string, protocol: string): IWebsocket;

  protected stageError(msg: string) {
    return new Error(`stage error: current=${this.stage.cur.type}, msg=${msg}`);
  }

  protected stage = new FSM<ITunnelStage>({ type: 'init' }, ({ from, to }) =>
    this.emit(new StageChangeEvt(from, to))
  );

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

      this.getTunnelToken()
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
          const ws = this.getWs(url, 'pilib-tunnel');

          ws.onopen = () => this.stage.transform({ type: 'connect-success', ws });

          // 转发事件
          ws.onmessage = msg => {
            // FIXME: 现在忽略 binary 类型的数据
            let utf8Data = typeof msg.data === 'string' ? msg.data : undefined;
            if (!utf8Data) return;

            const dto = parseDTO(utf8Data);
            if (!dto) return;

            this.emit(new TunnelMsgEvt(dto));
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
  disconnect(code: number = 0, desc: string = 'close') {
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
      const msg = dto.sequelize();
      ws.send(msg);
      //
    } else {
      throw this.stageError('send');
    }
  }

  destroy() {
    // 断开连接
    this.disconnect();

    // 关闭所有监听
    this.off();
  }
}
