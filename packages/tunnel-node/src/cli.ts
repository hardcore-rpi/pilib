#!/usr/bin/env node

import * as yargs from 'yargs';
import { Logger } from 'ah-logger';
import {
  ITunnelConfig,
  StageChangeEvt,
  ReconnectEvt,
  TunnelErrorEvt,
  TunnelMsgEvt,
  TunnelNode,
} from './index';

const logger = new Logger('Tunnel');

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

const tunnel = new TunnelNode(config);

tunnel
  .on(StageChangeEvt, ev => {
    let msg = '';

    if (ev.to.type === 'auth-failed') msg = ev.to.err + '';
    if (ev.to.type === 'connecting') msg = ev.to.url;
    if (ev.to.type === 'disconnected') msg = `code=${ev.to.code}, desc=${ev.to.desc}`;

    logger.info(`StageChangeEvt: ${ev.from.type} -> ${ev.to.type}${msg ? ', msg:\n' + msg : ''}`);
  })
  .on(TunnelMsgEvt, ev => logger.info(`receive: ${ev.dto.type}\n${ev.dto.sequelize()}`))
  .on(TunnelErrorEvt, ev => logger.error(ev.err.message))
  .on(ReconnectEvt, ev => logger.info(`reconnecting in ${ev.delay}ms`));

tunnel.connect();
