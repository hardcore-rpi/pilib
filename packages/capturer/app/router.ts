import { DefaultContext } from 'koa';
import Router from 'koa-router';
import { liveMonitor } from './controller/liveMonitor';

export const router = new Router<any, DefaultContext>();

// 路由表
router.get('/live', liveMonitor);
