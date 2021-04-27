import { createNodeAdapter } from 'pilib-tunnel-node';
import { FSM } from 'pilib-tunnel-core';
import * as pty from 'node-pty';
import { EventBus } from 'ah-event-bus';
import { Logger } from 'ah-logger';
import { TunnelProtocol, ITunnelConfig, TerminalEvent, SystemEvent } from 'pilib-tunnel-protocol';
import * as os from 'os';
import { exec } from 'child_process';

export type IAgentCfg = Omit<ITunnelConfig, 'protocol'> & { session: string };

export class Agent extends EventBus {
  constructor(readonly cfg: IAgentCfg) {
    super();
  }

  protected tunnel = new TunnelProtocol(
    { ...this.cfg, protocol: 'common-agent' },
    createNodeAdapter(this.cfg.session)
  );

  protected logger = new Logger('Agent');

  protected st = {
    terminal: new FSM<{ type: 'init' } | { type: 'launched'; terminal: pty.IPty }>(
      { type: 'init' },
      () => {}
    ),
  };

  protected handleTerminalEvt = (ev: TerminalEvent) => {
    if (ev.msg.type === 'spawn') {
      if (this.st.terminal.cur.type === 'launched') {
        // reset 一遍
        const { terminal } = this.st.terminal.cur;
        terminal.kill();
        this.tunnel.terminal.send({
          type: 'log',
          level: 'info',
          msg: 'current terminal killed (reset)',
        });
      }

      const terminal = pty.spawn('/bin/bash', [], {
        name: 'xterm-color',
        cols: ev.msg.cfg.cols,
        rows: ev.msg.cfg.rows,
        cwd: process.env.HOME,
        env: process.env as any,
      });

      terminal.onData(data => this.tunnel.terminal.send({ type: 'print', data }));

      terminal.onExit(({ exitCode, signal }) => {
        if (exitCode === 0) {
          this.tunnel.terminal.send({
            type: 'log',
            level: 'info',
            msg: `terminal exit. signal=${signal}`,
          });
        } else {
          this.tunnel.terminal.send({
            type: 'log',
            level: 'error',
            msg: `exited with error: exitCode=${exitCode}, signal=${signal}`,
          });
        }
      });

      this.tunnel.terminal.send({ type: 'log', level: 'info', msg: `terminal spawned` });

      // notice master
      const sysInfo = [
        `platform: ${os.platform()}`,
        `arch: ${os.arch()}`,
        `totalmem: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)}G`,
        ...os.cpus().map((ci, i, _l) => `cpu(${i + 1}/${_l.length}): ${ci.model}@${ci.speed}MHz`),
      ].join('\n');

      this.tunnel.terminal.send({ type: 'log', level: 'info', msg: sysInfo });

      this.st.terminal.transform({ type: 'launched', terminal });
      //
    } else if (ev.msg.type === 'print') {
      if (this.st.terminal.cur.type === 'launched') {
        this.st.terminal.cur.terminal.write(ev.msg.data);
      }
      //
    } else if (ev.msg.type === 'log') {
      this.logger.info(`terminal log: ${ev.msg.level} ${ev.msg.msg}`);
    }
  };

  protected handleSystemEvt = (ev: SystemEvent) => {
    if (ev.msg.type === 'inspect-static-req') {
      this.tunnel.system.send({
        type: 'inspect-static-rsp',
        arch: os.arch(),
        platform: os.platform(),
        totalmem: os.totalmem(),
        cups: os.cpus(),
      });
      //
    } else if (ev.msg.type === 'inspect-dynamic-req') {
      this.tunnel.system.send({
        type: 'inspect-dynamic-rsp',
        freemem: os.freemem(),
        loadavg: os.loadavg(),
      });
      //
    } else if (ev.msg.type === 'invoke-req') {
      const process = exec(ev.msg.cmd, (err, stdout, stderr) => {
        this.tunnel.system.send({
          type: 'invoke-rsp',
          stdout,
          stderr,
          exitCode: err?.code || 0,
        });
      });

      // 超时 kill
      setTimeout(() => {
        !process.killed && process.kill();
      }, 10e3);
    }
  };

  start() {
    this.tunnel.on(TerminalEvent, this.handleTerminalEvt);
    this.tunnel.on(SystemEvent, this.handleSystemEvt);

    this.tunnel.connect();
  }
}
