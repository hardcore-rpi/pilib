import { IApp, Context } from 'koa';

export type IScheduleCron = {
  type: 'cron';
  cron: string;
  runOnInit?: boolean;
};

export type IScheduleInterval = {
  type: 'interval';
  interval: number;
};

export type IScheduleConfig = IScheduleCron | IScheduleInterval;

export abstract class BaseSchedule<T extends IScheduleConfig> {
  readonly name = this.constructor.name;

  abstract config: T;
  abstract invoke(): Promise<void>;

  protected ctx!: Context;

  constructor(protected readonly app: IApp) {}

  logger: IApp['logger'] = this.app.logger.extend(this.name);

  setCtx(c: Context) {
    this.ctx = c;
  }
}
