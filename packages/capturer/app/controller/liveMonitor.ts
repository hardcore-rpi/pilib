import Koa from 'koa';

export const liveMonitor: Koa.Middleware = async ctx => {
  const { currentSnapshot } = ctx.service.capturer;
  if (!currentSnapshot) return;

  const { buf } = await currentSnapshot.toBuf();

  ctx.set({
    'Content-Type': 'image',
    Refresh: ctx.app.config.LIVE_REFRESH_INTERVAL + '',
  });

  ctx.body = buf;
};
