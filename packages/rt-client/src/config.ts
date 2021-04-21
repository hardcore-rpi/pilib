import * as yargs from 'yargs';

export interface IConfig {
  endpoint: string;
}

export function getConfig(): IConfig {
  const args = yargs.option('endpoint', { default: 'wss://api.biko.pub/tunnel/client' }).argv;
  return args;
}
