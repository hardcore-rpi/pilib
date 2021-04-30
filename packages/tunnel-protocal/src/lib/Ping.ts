import { DataTextDTO, TunnelMsgEvt, DTOPayload } from 'pilib-tunnel-core';
import { BaseEvent } from 'ah-event-bus';
import { BaseProtocol } from './Base';

export interface IPingMsgValueMap {
  ping: { type: 'ping' };
  pong: { type: 'pong' };
}

export type IPingMsgValue = IPingMsgValueMap['ping'] | IPingMsgValueMap['pong'];

export class PingEvent extends BaseEvent {
  constructor(readonly msg: IPingMsgValue, readonly meta: { payload: DTOPayload }) {
    super();
  }
}

export class PingProtocol extends BaseProtocol<IPingMsgValue> {
  namespace = 'ping';

  protected handleTunnelMsgEvt(ev: TunnelMsgEvt) {
    if (ev.dto instanceof DataTextDTO) {
      const msg = JSON.parse(ev.dto.value) as IPingMsgValue;
      this.tunnel.emit(new PingEvent(msg, { payload: ev.payload }));
    }
  }
}
