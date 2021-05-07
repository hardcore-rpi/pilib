import { BaseController, IApplication, IContext, IRouterMeta } from 'ah-server';
import { CapturerUpdateEvt } from '../Event';

/** 触发拍照 */
export class ShotController extends BaseController {
  mapper: IRouterMeta[] = [
    {
      path: '/shot',
      method: 'GET',
      handler: this.shot,
      query: {
        schema: {
          type: 'object',
          properties: {
            upload: { type: 'string' },
            detect: { type: 'string' },
          },
        },
      },
    },
  ];

  private capturerEvt?: CapturerUpdateEvt;

  constructor(app: IApplication) {
    super(app);

    const update = (evt: CapturerUpdateEvt) => (this.capturerEvt = evt);
    this.app.on(CapturerUpdateEvt, update);
  }

  async shot(ctx: IContext, query: { upload?: string; detect?: string }) {
    if (!this.capturerEvt) return;

    let snapshot = this.capturerEvt.snapshot;

    if (query.detect === '1') {
      snapshot = this.capturerEvt.detector.mark().markedSnapshot;
    }

    if (query.upload === '1') {
      await ctx.app.service.uploader.upload(snapshot);
    }

    const { buf } = snapshot.toBuf();

    ctx.set({ 'Content-Type': 'image' });
    ctx.body = buf;
  }
}
