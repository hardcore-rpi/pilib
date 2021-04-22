#!/usr/bin/env node

import * as yargs from 'yargs';
import { createNodeAdapter } from './index';
import { ITunnelConfig, Tunnel } from 'pilib-tunnel-core';

const args = yargs
  .option('secure', { type: 'boolean', default: true })
  .option('protocol', { default: 'simple' })
  .option('endpoint', { default: 'api.biko.pub' })
  .option('name', { default: 'new-tunnel' }).argv;

const config: ITunnelConfig = {
  endpoint: args.endpoint,
  secure: args.secure,
  name: args.name,
  protocol: args.protocol,
};

// 安全原因，从 env 中读取 session (命令行参数的 session 会被记录在 bash history 中)
const adapter = createNodeAdapter(process.env.TUNNEL_SESSION || '');

const tunnel = new Tunnel(config).setAdapter(adapter);
tunnel.connect();
