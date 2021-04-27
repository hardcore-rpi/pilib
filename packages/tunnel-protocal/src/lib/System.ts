import { DataTextDTO, TunnelMsgEvt, DTOPayload } from 'pilib-tunnel-core';
import { BaseEvent } from 'ah-event-bus';
import { BaseProtocol } from './Base';

export type ISystemMsgValue =
  | {
      type: 'inspect-static-req';
    }
  | {
      type: 'inspect-static-rsp';
      cups: {
        model: string;
        speed: number;
      }[];
      totalmem: number;
      platform: string;
      arch: string;
    }
  | {
      type: 'inspect-dynamic-req';
    }
  | {
      type: 'inspect-dynamic-rsp';
      freemem: number;
      loadavg: number[];
    }
  | {
      type: 'invoke-req';
      cmd: string;
    }
  | {
      type: 'invoke-rsp';
      stdout: string;
      stderr: string;
      exitCode: number;
    };

export class SystemEvent extends BaseEvent {
  constructor(readonly msg: ISystemMsgValue, readonly meta: { payload: DTOPayload }) {
    super();
  }
}

export class SystemProtocol extends BaseProtocol<ISystemMsgValue> {
  namespace = 'system';

  protected handleTunnelMsgEvt(ev: TunnelMsgEvt) {
    if (ev.dto instanceof DataTextDTO) {
      const msg = JSON.parse(ev.dto.value) as ISystemMsgValue;
      this.tunnel.emit(new SystemEvent(msg, { payload: ev.payload }));
    }
  }
}
