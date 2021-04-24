import {
  CommandDTO,
  DataTextDTO,
  ITunnelConfig,
  Tunnel,
  TunnelMsgEvt,
  ITunnelAdapter,
  DTOPayload,
} from 'pilib-tunnel-core';
import { BaseEvent } from 'ah-event-bus';

export interface ISpawnCfg {
  cols: number;
  rows: number;
}

export class SpawnEvt extends BaseEvent {
  constructor(readonly cfg: ISpawnCfg, readonly payload: DTOPayload) {
    super();
  }
}

export class LogEvt extends BaseEvent {
  constructor(
    readonly level: 'error' | 'info',
    readonly msg: string,
    readonly payload: DTOPayload
  ) {
    super();
  }
}

export class TerminalPrintEvt extends BaseEvent {
  constructor(readonly data: string, readonly payload: DTOPayload) {
    super();
  }
}

export class TunnelSSHProtocol extends Tunnel {
  constructor(cfg: ITunnelConfig, adapter: ITunnelAdapter) {
    super(cfg, adapter);
    this.init();
  }

  protected init() {
    this.on(TunnelMsgEvt, ev => {
      if (ev.dto instanceof CommandDTO) {
        const cmd = ev.dto.cmd;
        const args = JSON.parse(ev.dto.args);

        if (cmd === 'spawn') this.emit(new SpawnEvt(args, ev.payload));
        if (cmd === 'log') this.emit(new LogEvt(args.level, args.msg, ev.payload));
      }

      if (ev.dto instanceof DataTextDTO) this.emit(new TerminalPrintEvt(ev.dto.value, ev.payload));
    });
  }

  sendSpawn(cfg: ISpawnCfg) {
    this.send(new CommandDTO('spawn', JSON.stringify(cfg)));
  }

  sendLog(level: 'error' | 'info', msg: string) {
    this.send(new CommandDTO('log', JSON.stringify({ level, msg })));
  }

  sendTerminalPrint(data: string) {
    this.send(new DataTextDTO(data));
  }
}
