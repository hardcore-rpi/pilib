#!/usr/bin/env node

import Koa, { Context, IService } from 'koa';
import { router } from './router';
import { start as startSchedule } from './schedule';
import { Config } from './Config';
import { validate } from './context';
import urllib, { RequestOptions } from 'urllib';
import { BaseService, Camera, FaceDetector, Uploader, Capturer } from './service';
import { Logger } from './Logger';

declare module 'koa' {
  interface DefaultContext {
    app: IApp;
    service: IService;
  }

  interface IApp extends App {}

  // 这个用于 service 类型合并
  interface IService {
    [name: string]: BaseService;
  }
}

export class App extends Koa {
  config = new Config();
  logger = new Logger('app');

  // 注入 app 扩展
  service: IService = {
    camera: new Camera(this),
    faceDetector: new FaceDetector(this),
    uploader: new Uploader(this),
    capturer: new Capturer(this),
  };

  async curl<T>(url: string, opt?: RequestOptions) {
    return urllib.request<T>(url, opt);
  }
}

async function run() {
  const app = new App();

  app.logger.info(`config: ${app.config.toLogStr()}`);

  // 扩展 ctx
  Object.assign(app.context, { validate, service: app.service });

  // 路由
  app.use(router.routes()).use(router.allowedMethods());

  // 全局错误
  app.on('error', (err, ctx: Context) => {
    ctx.app.logger.error(err.message || err);
  });

  // service init
  await Promise.all(Object.values(app.service).map(async s => s.init()));

  // 定时器
  startSchedule(app);

  // 启动监听
  app.listen(app.config.LOCAL_PORT);
}

// 启动
run().catch(e => {
  console.error(e);
  process.exit(1);
});
