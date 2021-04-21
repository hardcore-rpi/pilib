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
import { curl } from 'urllib';

const logger = new Logger('Tunnel');

const args = yargs
  .option('session', { type: 'string' })
  .option('secure', { type: 'boolean', default: true })
  .option('endpoint', { default: 'api.biko.pub' })
  .option('name', { default: 'new-tunnel' })
  .demandOption('session').argv;

const config: ITunnelConfig = {
  endpoint: args.endpoint,
  secure: args.secure,
  name: args.name,
  adapter: {
    auth: {
      getTunnelToken: async () => {
        const httpProtocol = args.secure ? 'https' : 'http';

        const resp = await curl<{ data: { token: string } }>(
          `${httpProtocol}://${args.endpoint}/user/tunnelToken`,
          { dataType: 'json', headers: { 'x-user-session': args.session } }
        );

        if (resp.status !== 200) throw new Error(`getTunnelToken error: ${resp.status}`);
        return resp.data.data.token;
      },
    },
  },
};

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
