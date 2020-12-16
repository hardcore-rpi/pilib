import { Controller, IContext, IControllerMapperItem } from 'ah-server';
import { CapturerUpdateEvt } from '../Event';

/** 触发拍照 */
export class ShotController extends Controller {
  mapper: IControllerMapperItem[] = [
    {
      path: '/shot',
      method: 'GET',
      handler: this.shot,
    },
  ];

  private capturerEvt?: CapturerUpdateEvt;
  private disposeList: (() => void)[] = [];

  async init() {
    const update = (evt: CapturerUpdateEvt) => {
      this.capturerEvt = evt;
    };

    this.app.on(CapturerUpdateEvt, update);
    this.disposeList.push(() => this.app.off(CapturerUpdateEvt, update));
  }

  async shot(ctx: IContext) {
    if (!this.capturerEvt) return;

    const query = ctx.validate<{ upload?: string; detect?: string }>(ctx.request.query, {
      type: 'object',
      properties: {
        upload: { type: 'string' },
        detect: { type: 'string' },
      },
    });

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
