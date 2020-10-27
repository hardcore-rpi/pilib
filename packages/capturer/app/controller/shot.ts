import Koa from 'koa';

/** 触发拍照 */
export const shot: Koa.Middleware = async ctx => {
  const query = ctx.validate<{ upload?: string }>(ctx.request.query, {
    type: 'object',
    properties: {
      upload: { type: 'string' },
    },
  });

  const snapshot = await ctx.app.service.camera.read();

  if (query.upload === '1') {
    await ctx.app.service.uploader.upload(snapshot);
  }

  const { buf } = await snapshot.toBuf();

  ctx.set({ 'Content-Type': 'image' });
  ctx.body = buf;
};
