import { createNodeAdapter } from 'pilib-tunnel-node';
import { FSM } from 'pilib-tunnel-core';
import * as pty from 'node-pty';
import { EventBus } from 'ah-event-bus';
import { Logger } from 'ah-logger';
import { TunnelSSHProtocol, TerminalPrintEvt, SpawnEvt, LogEvt } from 'pilib-tunnel-ssh-protocol';
import * as os from 'os';
import { ITunnelSlaveCfg, ITunnelSlaveImpl } from './type';
import { version } from '../package.json';

export type ITunnelSSHSlaveCfg = ITunnelSlaveCfg;

export class TunnelSSHSlave extends EventBus implements ITunnelSlaveImpl {
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
          tunnel.sendLog('info', 'current terminal killed (reset)');
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
          if (exitCode === 0) tunnel.sendLog('info', `terminal exit. signal=${signal}`);
          else tunnel.sendLog('error', `exited with error: exitCode=${exitCode}, signal=${signal}`);
        });

        tunnel.sendLog('info', `v${version} terminal spawned`);

        // notice master
        const sysInfo = [
          `platform: ${os.platform()}`,
          `arch: ${os.arch()}`,
          `totalmem: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)}G`,
          ...os.cpus().map((ci, i, _l) => `cpu(${i + 1}/${_l.length}): ${ci.model}@${ci.speed}MHz`),
        ].join('\n');

        tunnel.sendLog('info', sysInfo);

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
