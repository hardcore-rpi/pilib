import { DataTextDTO, TunnelMsgEvt, DTOPayload } from 'pilib-tunnel-core';
import { BaseEvent } from 'ah-event-bus';
import { BaseProtocol } from './Base';

export type ITerminalMsgValue =
  | {
      type: 'spawn';
      cfg: {
        cols: number;
        rows: number;
      };
    }
  | {
      type: 'log';
      level: 'error' | 'info';
      msg: string;
    }
  | {
      type: 'print';
      data: string;
    };

export class TerminalEvent extends BaseEvent {
  constructor(readonly msg: ITerminalMsgValue, readonly meta: { payload: DTOPayload }) {
    super();
  }
}

export class TerminalProtocol extends BaseProtocol<ITerminalMsgValue> {
  namespace = 'terminal';

  protected handleTunnelMsgEvt(ev: TunnelMsgEvt) {
    if (ev.dto instanceof DataTextDTO) {
      const msg = JSON.parse(ev.dto.value) as ITerminalMsgValue;
      this.tunnel.emit(new TerminalEvent(msg, { payload: ev.payload }));
    }
  }
}
