import { DefaultContext } from 'koa';
import Router from 'koa-router';
import { liveMonitor, shot } from './controller';

export const router = new Router<any, DefaultContext>();

// 路由表
router.get('/live', liveMonitor);
router.get('/shot', shot);
