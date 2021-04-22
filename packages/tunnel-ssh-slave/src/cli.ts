#!/usr/bin/env node

import * as yargs from 'yargs';
import { TunnelSSHSlave, ITunnelSSHSlaveCfg } from './index';
import { execSync } from 'child_process';

const defaultName = execSync('uname -a', { encoding: 'utf-8' });

const args = yargs
  .option('secure', { type: 'boolean', default: true })
  .option('endpoint', { default: 'api.biko.pub' })
  .option('name', { default: defaultName }).argv;

const config: ITunnelSSHSlaveCfg = {
  endpoint: args.endpoint,
  secure: args.secure,
  name: args.name,
};

const slave = new TunnelSSHSlave(config);
slave.start();
