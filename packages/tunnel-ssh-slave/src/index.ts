import { createNodeAdapter } from 'pilib-tunnel-node';
import { ITunnelConfig, FSM } from 'pilib-tunnel-core';
import * as pty from 'node-pty';
import { EventBus } from 'ah-event-bus';
import { Logger } from 'ah-logger';
import { TunnelSSHProtocol, TerminalPrintEvt, SpawnEvt, LogEvt } from 'pilib-tunnel-ssh-protocol';

export type ITunnelSSHSlaveCfg = Omit<ITunnelConfig, 'protocol'>;

export class TunnelSSHSlave extends EventBus {
  constructor(readonly cfg: ITunnelSSHSlaveCfg) {
    super();
  }

  protected logger = new Logger('TunnelSSHSlave');

  protected st = new FSM<{ type: 'init' } | { type: 'terminal-launched'; terminal: pty.IPty }>(
    { type: 'init' },
    ({ from, to }) => {
      this.logger.info(`state change: ${from.type} -> ${to.type}`);
    }
  );

  start() {
    this.logger.info(`starting with ${JSON.stringify(this.cfg)}`);

    const tunnel = new TunnelSSHProtocol(
      { ...this.cfg, protocol: 'ssh-slave' },
      createNodeAdapter(process.env.TUNNEL_SESSION || '')
    );

    tunnel
      .on(SpawnEvt, ev => {
        if (this.st.cur.type === 'terminal-launched') {
          // reset 一遍
          const { terminal } = this.st.cur;
          terminal.kill();
        }

        const terminal = pty.spawn('/bin/bash', [], {
          name: 'xterm-color',
          cols: ev.cfg.cols,
          rows: ev.cfg.rows,
          cwd: process.env.HOME,
          env: process.env as any,
        });

        terminal.onData(d => tunnel.sendTerminalPrint(d));

        terminal.onExit(({ exitCode, signal }) => {
          tunnel.sendLog('error', `exitCode=${exitCode}, signal=${signal}`);
        });

        this.st.transform({ type: 'terminal-launched', terminal });
      })
      .on(TerminalPrintEvt, ev => {
        if (this.st.cur.type === 'terminal-launched') {
          const { terminal } = this.st.cur;
          terminal.write(ev.data);
        } else {
          this.logger.error(`terminal is not launched: current=${this.st.cur.type}`);
        }
      })
      .on(LogEvt, ev => {
        this.logger.info(`remote message: [${ev.level}] ${ev.msg}`);
      });

    tunnel.connect();
  }
}
