import { Middleware } from 'koa';
import { CapturerUpdateEvt } from '../Event';
import { LiveStream } from '../LiveStream';

export const liveStream: Middleware = async ctx => {
  const streamIns = new LiveStream(
    ctx.app.config.CAMERA_WIDTH,
    ctx.app.config.CAMERA_HEIGHT,
    ctx.app.config.CAMERA_FRAME_RATE
  );

  const update = ({ snapshot }: CapturerUpdateEvt) => {
    streamIns.update(snapshot.copy({ markAllFaces: true }));
  };
  ctx.app.on(CapturerUpdateEvt, update);

  const clearUp = () => {
    ctx.app.off(CapturerUpdateEvt, update);
    streamIns.dispose();
  };

  ctx.response.res.once('close', clearUp);

  ctx.status = 200;
  ctx.set({
    'Content-Type': streamIns.mimeType,
    'Access-Control-Allow-Origin': '*',
  });

  ctx.flushHeaders();
  ctx.body = streamIns.output;
};
