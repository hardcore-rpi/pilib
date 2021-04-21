import { EventBus } from 'ah-event-bus';
import { FSM } from './lib/FSM';
import { client as WebSocketClient, connection } from 'websocket';
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
  | { type: 'connected'; conn: connection }
  | { type: 'connect-failed'; err: Error }
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
      this.stage.cur.type === 'connect-failed' ||
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

          const ws = new WebSocketClient();

          ws.on('connect', conn => {
            this.stage.transform({ type: 'connected', conn });

            // 如果对方关闭连接，转入 disconnected
            conn.on('close', (code, desc) => {
              this.stage.transform({ type: 'disconnected', code, desc });
              reconnect();
            });

            // 转发事件
            conn.on('message', d => {
              // FIXME: 现在忽略 binary 类型的数据
              const utf8Data = d.utf8Data;
              if (!utf8Data) return;

              const dto = parseDTO(utf8Data);
              if (!dto) return;

              this.emit(new TunnelMsgEvt(dto));
            });
          });

          ws.on('connectFailed', err => {
            this.stage.transform({ type: 'connect-failed', err });
            reconnect();
          });

          const wsProtocol = this.cfg.secure ? 'wss' : 'ws';
          const query = new URLSearchParams({ name: this.cfg.name, token }).toString();
          const url = `${wsProtocol}://${this.cfg.endpoint}/tunnel/client?${query}`;

          // 开始连接 ws
          ws.connect(url, 'pilib-tunnel', undefined);
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
    if (this.stage.cur.type === 'connected') {
      const { conn } = this.stage.cur;

      // FIXME: 关闭操作可能有要延时等待的地方
      conn.close();
      conn.removeAllListeners();

      this.stage.transform({ type: 'disconnected', code, desc });
      //
    } else {
      throw this.stageError('disconnect');
    }
  }

  send(dto: BaseDTO) {
    if (this.stage.cur.type === 'connected') {
      const { conn } = this.stage.cur;
      const msg = dto.sequelize();
      conn.send(msg, err => err && this.emit(new TunnelErrorEvt(err)));
      //
    } else {
      throw this.stageError('send');
    }
  }
}
