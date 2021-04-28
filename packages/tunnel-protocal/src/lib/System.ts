import { DataTextDTO, TunnelMsgEvt, DTOPayload } from 'pilib-tunnel-core';
import { BaseEvent } from 'ah-event-bus';
import { BaseProtocol } from './Base';

export interface ISystemMsgValueMap {
  'inspect-static-req': { type: 'inspect-static-req' };
  'inspect-static-rsp': {
    type: 'inspect-static-rsp';
    cups: {
      model: string;
      speed: number;
    }[];
    totalmem: number;
    platform: string;
    arch: string;
    opSystem: string;
    networkInterface: {
      [name: string]: {
        address: string;
        netmask: string;
        mac: string;
        internal: boolean;
        cidr: string | null;
        family: string;
        scopeid?: number;
      }[];
    };
  };
  'inspect-dynamic-req': {
    type: 'inspect-dynamic-req';
  };
  'inspect-dynamic-rsp': {
    type: 'inspect-dynamic-rsp';
    freemem: number;
    usemem: number;
    loadavg: number[];
  };
  'invoke-req': {
    type: 'invoke-req';
    cmd: string;
  };
  'invoke-rsp': {
    type: 'invoke-rsp';
    stdout: string;
    stderr: string;
    exitCode: number;
  };
}

export type ISystemMsgValue =
  | ISystemMsgValueMap['inspect-static-req']
  | ISystemMsgValueMap['inspect-static-rsp']
  | ISystemMsgValueMap['inspect-dynamic-req']
  | ISystemMsgValueMap['inspect-dynamic-rsp']
  | ISystemMsgValueMap['invoke-req']
  | ISystemMsgValueMap['invoke-rsp'];

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
