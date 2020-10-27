import { IApp } from 'koa';

export abstract class BaseService {
  readonly name = this.constructor.name;

  constructor(protected app: IApp) {}

  abstract init(): Promise<void>;
  abstract release(): Promise<void>;

  get service() {
    return this.app.service;
  }

  get config() {
    return this.app.config;
  }

  logger: IApp['logger'] = this.app.logger.extend(this.name);
}
