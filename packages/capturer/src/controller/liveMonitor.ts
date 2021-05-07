import { BaseController, IApplication, IContext, IRouterMeta } from 'ah-server';
import { CapturerFrameEvt } from '../Event';

export class LiveMonitorController extends BaseController {
  mapper: IRouterMeta[] = [
    {
      path: '/live',
      method: 'GET',
      handler: this.getSnapshot,
    },
  ];

  private capturerEvt?: CapturerFrameEvt;

  constructor(app: IApplication) {
    super(app);

    const update = (evt: CapturerFrameEvt) => (this.capturerEvt = evt);
    this.app.on(CapturerFrameEvt, update);
  }

  async getSnapshot(ctx: IContext) {
    if (!this.capturerEvt) return;

    const { detector } = this.capturerEvt;

    ctx.set({
      'Content-Type': 'image',
      Refresh: ctx.app.config.LIVE_REFRESH_INTERVAL + '',
    });

    const { markedSnapshot } = detector.mark();
    ctx.body = markedSnapshot.toBuf().buf;
  }
}
