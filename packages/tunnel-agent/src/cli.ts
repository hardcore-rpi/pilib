#!/usr/bin/env node

import * as yargs from 'yargs';
import { TunnelSSHSlave } from './index';
import { execSync } from 'child_process';
import * as yml from 'js-yaml';
import * as path from 'path';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { Config } from './config';

const defaultName = execSync('uname -a', { encoding: 'utf-8' });
const CONFIG_PATH = path.resolve(process.env.HOME!, '.pilib-tunnel-agent.yml');

interface IConfig {
  session?: string;
}

const readCfg = (): IConfig => {
  if (!existsSync(CONFIG_PATH)) writeFileSync(CONFIG_PATH, '', { encoding: 'utf-8' });
  return yml.load(readFileSync(CONFIG_PATH, { encoding: 'utf-8' })) as any;
};

const updateCfg = (cfg: Partial<IConfig>): IConfig => {
  const lastCfg = readCfg();
  const newCfg = { ...lastCfg, ...cfg };

  writeFileSync(CONFIG_PATH, yml.dump(newCfg), { encoding: 'utf-8' });

  return newCfg;
};

yargs
  .command(
    'auth',
    '设置登录 session',
    () => {},
    args => {
      const [, session] = args._;

      if (session) {
        updateCfg({ session: session + '' });
      }
    }
  )
  .command(
    'config',
    '配置',
    _y => {
      return _y
        .option('show', { type: 'boolean', desc: '打印配置' })
        .option('path', { type: 'boolean', desc: '打印配置文件地址' })
        .help();
    },
    args => {
      if (args.show) {
        const cfg = readCfg();
        console.log(JSON.stringify(cfg, null, 2));
        return;
      }

      if (args.path) {
        console.log(CONFIG_PATH);
        return;
      }
    }
  )
  // terminal 子命令
  .command(
    'terminal',
    '命令行终端代理',
    _y => {
      return _y
        .option('endpoint', { type: 'string', desc: '通道连接地址' })
        .option('secure', { type: 'boolean', desc: '使用 TLS 加密连接' })
        .option('name', { type: 'string', desc: '连接名称' })
        .help();
    },
    args => {
      const config = new Config().update(readCfg()).update(args);
      new TunnelSSHSlave(config).start();
    }
  ).argv;
