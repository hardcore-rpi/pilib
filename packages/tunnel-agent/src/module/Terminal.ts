import { FSM, TerminalEvent } from 'pilib-tunnel-protocol';
import { BaseModule } from './base';
import * as os from 'os';
import * as pty from 'node-pty';

export class Terminal extends BaseModule {
  protected st = new FSM<{ type: 'init' } | { type: 'launched'; terminal: pty.IPty }>(
    { type: 'init' },
    () => {}
  );

  protected handleTerminalEvt = (ev: TerminalEvent) => {
    if (ev.msg.type === 'spawn') {
      if (this.st.cur.type === 'launched') {
        // reset 一遍
        const { terminal } = this.st.cur;
        terminal.kill();
        this.agent.tunnel.terminal.send({
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

      terminal.onData(data => this.agent.tunnel.terminal.send({ type: 'print', data }));

      terminal.onExit(({ exitCode, signal }) => {
        if (exitCode === 0) {
          this.agent.tunnel.terminal.send({
            type: 'log',
            level: 'info',
            msg: `terminal exit. signal=${signal}`,
          });
        } else {
          this.agent.tunnel.terminal.send({
            type: 'log',
            level: 'error',
            msg: `exited with error: exitCode=${exitCode}, signal=${signal}`,
          });
        }
      });

      this.agent.tunnel.terminal.send({ type: 'log', level: 'info', msg: `terminal spawned` });

      // notice master
      const sysInfo = [
        `platform: ${os.platform()}`,
        `arch: ${os.arch()}`,
        `totalmem: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)}G`,
        ...os.cpus().map((ci, i, _l) => `cpu(${i + 1}/${_l.length}): ${ci.model}@${ci.speed}MHz`),
      ].join('\n');

      this.agent.tunnel.terminal.send({ type: 'log', level: 'info', msg: sysInfo });

      this.st.transform({ type: 'launched', terminal });
      //
    } else if (ev.msg.type === 'print') {
      if (this.st.cur.type === 'launched') {
        this.st.cur.terminal.write(ev.msg.data);
      }
      //
    } else if (ev.msg.type === 'log') {
      this.logger.info(`terminal log: ${ev.msg.level} ${ev.msg.msg}`);
    }
  };

  start() {
    this.logger.info('start');
    this.agent.tunnel.on(TerminalEvent, this.handleTerminalEvt);
  }

  stop() {
    this.logger.info('stop');

    if (this.st.cur.type === 'launched') {
      this.st.cur.terminal.kill();
      this.st.transform({ type: 'init' });
    }
  }
}
