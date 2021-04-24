#!/usr/bin/env node

import * as yargs from 'yargs';
import { TunnelSSHSlave, ITunnelSSHSlaveCfg } from './index';
import { execSync } from 'child_process';

const defaultName = execSync('uname -a', { encoding: 'utf-8' });

yargs
  // terminal 子命令
  .command(
    'terminal',
    'command line terminal slave',
    _yargs => {
      return _yargs
        .option('secure', { type: 'boolean', default: true })
        .option('endpoint', { default: 'api.biko.pub' })
        .option('name', { default: defaultName })
        .help();
    },
    args => {
      const config: ITunnelSSHSlaveCfg = {
        endpoint: args.endpoint,
        secure: args.secure,
        name: args.name,
      };

      new TunnelSSHSlave(config).start();
    }
  ).argv;
