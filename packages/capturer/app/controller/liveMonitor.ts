import { Middleware } from 'koa';

export const liveMonitor: Middleware = async ctx => {
  const { currentSnapshot } = ctx.app.service.capturer;
  if (!currentSnapshot) return;

  const { buf } = await currentSnapshot.toBuf();

  ctx.set({
    'Content-Type': 'image',
    Refresh: ctx.app.config.LIVE_REFRESH_INTERVAL + '',
  });

  ctx.body = buf;
};
