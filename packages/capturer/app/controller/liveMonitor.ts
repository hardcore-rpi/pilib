import { Controller, IContext, IControllerMapperItem } from 'ah-server';
import { CapturerUpdateEvt } from '../Event';

export class LiveMonitorController extends Controller {
  mapper: IControllerMapperItem[] = [
    {
      path: '/live',
      method: 'GET',
      handler: this.getSnapshot,
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
