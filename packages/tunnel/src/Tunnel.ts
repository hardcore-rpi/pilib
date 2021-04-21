import { EventBus } from 'ah-event-bus';
import { FSM } from './lib/FSM';
import { w3cwebsocket as WebSocketClient } from 'websocket';
import { TunnelMsgEvt, ReconnectEvt, StageChangeEvt, TunnelErrorEvt } from './event';
import { curl } from 'urllib';
import { BaseDTO, parseDTO } from './dto';

export interface ITunnelConfig {
  endpoint: string;
  secure: boolean;
  name: string;
  /** 用户登录 session */
  session: string;
}

export type ITunnelStage =
  | { type: 'init' }
  | { type: 'auth-checking' }
  | { type: 'auth-success'; token: string }
  | { type: 'auth-failed'; err: Error }
  | { type: 'connecting'; url: string; ws: WebSocketClient }
  | { type: 'connect-success'; ws: WebSocketClient }
  | { type: 'disconnected'; code: number; desc: string };

export class Tunnel extends EventBus {
  constructor(protected readonly cfg: ITunnelConfig) {
    super();
  }

  protected RECONNECT_DELAY = 10e3;

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
        this.emit(new ReconnectEvt(this.RECONNECT_DELAY));
        setTimeout(() => this.connect(), this.RECONNECT_DELAY);
      };

      const httpProtocol = this.cfg.secure ? 'https' : 'http';

      curl<{ data: { token: string } }>(`${httpProtocol}://${this.cfg.endpoint}/user/tunnelToken`, {
        method: 'GET',
        dataType: 'json',
        headers: {
          'x-user-session': this.cfg.session,
        },
      })
        .then(rsp => {
          const token = rsp.data.data.token;
          this.stage.transform({ type: 'auth-success', token });

          const wsProtocol = this.cfg.secure ? 'wss' : 'ws';
          const query = new URLSearchParams({ name: this.cfg.name, token }).toString();
          const url = `${wsProtocol}://${this.cfg.endpoint}/tunnel/client?${query}`;

          // 初始化 ws
          const ws = new WebSocketClient(url, 'pilib-tunnel');

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
}
