import { IApp } from 'koa';
import { CronJob } from 'cron';
import { BaseSchedule, IScheduleConfig, IScheduleCron, IScheduleInterval } from './base';
import { RefreshCapturer } from './RefreshCapturer';

export const start = (app: IApp) => {
  const logger = app.logger.extend('schedule');

  const list: BaseSchedule<IScheduleConfig>[] = [RefreshCapturer].map(S => new S(app));
  const cronList = list.filter(r => r.config.type === 'cron') as BaseSchedule<IScheduleCron>[];
  const intervalList = list.filter(r => r.config.type === 'interval') as BaseSchedule<
    IScheduleInterval
  >[];

  // cron
  const jobs = cronList.map(ins => {
    return new CronJob(
      ins.config.cron,
      () => {
        const ctx = app.createContext({} as any, {} as any);
        ins.setCtx(ctx);

        ins.invoke().catch(e => {
          ctx.app.logger.error(`[Schedule.${ins.name}] ${e.message || e}`);
        });
      },
      undefined,
      false,
      undefined,
      undefined,
      ins.config.runOnInit
    );
  });

  jobs.map(j => j.start());

  // interval
  intervalList.forEach(ins => {
    const invoke = () => {
      const ctx = app.createContext({} as any, {} as any);
      ins.setCtx(ctx);

      ins
        .invoke()
        .then(() => setTimeout(invoke, ins.config.interval))
        .catch(e => {
          ctx.app.logger.error(`[Schedule.${ins.name}] ${e.message || e}`);
          setTimeout(invoke, ins.config.interval);
        });
    };

    invoke();
  });

  logger.info(`Schedule ${list.map(r => r.name).join(',')} start`);
};
