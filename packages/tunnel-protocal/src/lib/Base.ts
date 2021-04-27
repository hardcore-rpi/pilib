import { BaseDTO, DataTextDTO, DTOPayload, Tunnel, TunnelMsgEvt } from 'pilib-tunnel-core';

export abstract class BaseProtocol<T> {
  abstract readonly namespace: string;
  protected abstract handleTunnelMsgEvt(ev: TunnelMsgEvt): void;

  constructor(protected readonly tunnel: Tunnel) {
    this.init();
  }

  init() {
    this.tunnel.on(TunnelMsgEvt, ev => {
      if (ev.dto.namespace !== this.namespace) return;
      this.handleTunnelMsgEvt(ev);
    });
  }

  send(msg: T) {
    this.tunnel.send(new DataTextDTO(JSON.stringify(msg)).setNamespace(this.namespace));
  }
}
