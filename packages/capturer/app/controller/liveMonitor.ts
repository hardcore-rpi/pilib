import { Middleware } from 'koa';

export const liveMonitor: Middleware = async ctx => {
  const { snapshot } = ctx.app.service.capturer;
  if (!snapshot) return;

  ctx.set({
    'Content-Type': 'image',
    Refresh: ctx.app.config.LIVE_REFRESH_INTERVAL + '',
  });

  const ns = snapshot.copy({ markAllFaces: true });
  ctx.body = ns.toBuf().buf;
};
