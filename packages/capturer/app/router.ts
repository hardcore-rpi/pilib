import { DefaultContext } from 'koa';
import Router from 'koa-router';
import { agent } from './controller/agent';

export const router = new Router<any, DefaultContext>();

// 路由表
router.post('/agent', agent);
