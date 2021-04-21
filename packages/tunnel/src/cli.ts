#!/usr/bin/env node

import * as yargs from 'yargs';
import {
  ITunnelConfig,
  Tunnel,
  StageChangeEvt,
  ReconnectEvt,
  TunnelErrorEvt,
  TunnelMsgEvt,
} from './index';
import { Logger } from 'ah-logger';

const logger = new Logger('Tunnel');

function getConfig(): ITunnelConfig {
  const args = yargs
    .option('session', { type: 'string' })
    .option('secure', { type: 'boolean', default: true })
    .option('endpoint', { default: 'api.biko.pub' })
    .option('name', { default: 'new-tunnel' })
    .demandOption('session').argv;

  return { endpoint: args.endpoint, session: args.session, name: args.name, secure: args.secure };
}

const config = getConfig();
logger.info(`config: ${JSON.stringify(config)}`);

const tunnel = new Tunnel(config);

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
