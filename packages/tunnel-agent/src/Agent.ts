import { createNodeAdapter } from 'pilib-tunnel-node';
import { EventBus } from 'ah-event-bus';
import { Logger } from 'ah-logger';
import { TunnelProtocol, ITunnelConfig, StageChangeEvt } from 'pilib-tunnel-protocol';
import { Terminal } from './module/Terminal';
import { BaseModule } from './module/base';
import { System } from './module/System';
import { randomString } from './util';
import { PingEvent } from 'pilib-tunnel-protocol/dist/lib/Ping';

export type IAgentCfg = Omit<ITunnelConfig, 'protocol'> & { session: string };

const PING_TIMEOUT = 60e3;

export class Agent extends EventBus {
  constructor(readonly cfg: IAgentCfg) {
    super();
  }

  tunnel = new TunnelProtocol(
    { ...this.cfg, protocol: 'common-agent' },
    createNodeAdapter(this.cfg.session)
  );

  logger = new Logger('Agent');

  killerInfo: {
    timer?: NodeJS.Timeout;
    stateFlag?: string;
  } = {};

  protected modules: BaseModule[] = [new Terminal(this), new System(this)];

  protected stopDelayKiller() {
    if (this.killerInfo.timer) {
      clearTimeout(this.killerInfo.timer);
      this.killerInfo.timer = undefined;
    }
  }

  protected restartDelayKiller() {
    this.stopDelayKiller();

    this.killerInfo.timer = setTimeout(() => {
      this.logger.info('killer timeout');
      this.modules.forEach(m => m.stop());
    }, PING_TIMEOUT * 0.8);
  }

  protected sendPing() {
    const stateFlag = randomString(4);

    this.killerInfo.stateFlag = stateFlag;
    this.tunnel.ping.send({ type: 'ping' }, { stateFlag });
    this.logger.info('send PING');

    this.restartDelayKiller();
  }

  protected handlerPingEvt = (ev: PingEvent) => {
    if (ev.msg.type === 'pong') {
      if (ev.meta.payload.meta.stateFlag === this.killerInfo.stateFlag) {
        this.stopDelayKiller();
      }
    }
  };

  start() {
    let pingTimer: NodeJS.Timeout;

    this.tunnel
      .on(StageChangeEvt, ev => {
        if (ev.to.type === 'connect-success') {
          pingTimer = setInterval(() => this.sendPing(), PING_TIMEOUT);
          //
        } else if (ev.to.type === 'disconnected') {
          pingTimer && clearInterval(pingTimer);
        }
      })
      .on(PingEvent, this.handlerPingEvt);

    this.modules.forEach(m => m.start());
    this.tunnel.connect();
  }
}
