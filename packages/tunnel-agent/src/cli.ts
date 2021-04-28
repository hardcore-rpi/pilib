#!/usr/bin/env node

import * as yargs from 'yargs';
import { Agent, IAgentCfg } from './index';
import { execSync } from 'child_process';
import * as yml from 'js-yaml';
import * as path from 'path';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { Config } from './config';
import * as inquirer from 'inquirer';

const CONFIG_PATH = path.resolve(process.env.HOME!, '.pt-agent.yml');

const readCfg = (): IAgentCfg => {
  if (!existsSync(CONFIG_PATH)) writeFileSync(CONFIG_PATH, '', { encoding: 'utf-8' });
  return (yml.load(readFileSync(CONFIG_PATH, { encoding: 'utf-8' })) as any) || {};
};

const updateCfg = (cfg: Partial<IAgentCfg>): IAgentCfg => {
  const lastCfg = readCfg();
  const newCfg = { ...lastCfg, ...cfg };

  writeFileSync(CONFIG_PATH, yml.dump(newCfg), { encoding: 'utf-8' });

  return newCfg;
};

yargs
  // auth
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
  // config
  .command(
    'config',
    '配置',
    _y => {
      return _y
        .option('init', { type: 'boolean', desc: '初始化配置' })
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

      if (args.init) {
        const cfg = new Config().update(readCfg());

        inquirer
          .prompt<{ name: string; session: string }>([
            { type: 'input', name: 'name', message: '设备名', default: cfg.name },
            { type: 'input', name: 'session', message: '登录 session', default: cfg.session },
          ])
          .then(ans => {
            updateCfg(ans);
          })
          .catch(err => {
            console.error(err);
            process.exit(1);
          });
      }
    }
  )
  // upgrade
  .command(
    'upgrade',
    '软件升级',
    () => {},
    () => {
      execSync(`cnpm i pt-agent -g`);
    }
  )
  // start
  .command(
    'start',
    '启动代理',
    _y => {
      return _y
        .option('endpoint', { type: 'string', desc: '通道连接地址' })
        .option('secure', { type: 'boolean', desc: '使用 TLS 加密连接' })
        .option('name', { type: 'string', desc: '连接名称' })
        .help();
    },
    args => {
      const config = new Config().update(readCfg()).update(args);
      new Agent(config).start();
    }
  ).argv;
