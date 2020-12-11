import { Controller, IContext, IControllerMapperItem } from 'ah-server';

/** 触发拍照 */
export class ShotController extends Controller {
  mapper: IControllerMapperItem[] = [
    {
      path: '/shot',
      method: 'GET',
      handler: this.shot,
    },
  ];

  async shot(ctx: IContext) {
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

    const { buf } = snapshot.toBuf();

    ctx.set({ 'Content-Type': 'image' });
    ctx.body = buf;
  }
}
