import { SystemEvent } from 'pilib-tunnel-protocol';
import { BaseModule } from './base';
import * as os from 'os';
import { exec, execSync } from 'child_process';

export class System extends BaseModule {
  protected handleSystemEvt = (ev: SystemEvent) => {
    if (ev.msg.type === 'inspect-static-req') {
      this.agent.tunnel.system.send({
        type: 'inspect-static-rsp',
        arch: os.arch(),
        platform: os.platform(),
        totalmem: os.totalmem(),
        cups: os.cpus(),
        opSystem: execSync('uname -a').toString('utf-8'),
        networkInterface: os.networkInterfaces() as any,
      });
      //
    } else if (ev.msg.type === 'inspect-dynamic-req') {
      const totalmem = os.totalmem();
      const freemem = os.freemem();

      this.agent.tunnel.system.send({
        type: 'inspect-dynamic-rsp',
        freemem,
        loadavg: os.loadavg(),
        usemem: totalmem - freemem,
      });
      //
    } else if (ev.msg.type === 'invoke-req') {
      const process = exec(ev.msg.cmd, (err, stdout, stderr) => {
        this.agent.tunnel.system.send({
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
      //
    }
  };

  start() {
    this.logger.info('start');
    this.agent.tunnel.on(SystemEvent, this.handleSystemEvt);
  }

  stop() {
    this.logger.info('stop');
  }
}
