import { Config } from './Config';
import { Logger } from './Logger';
import { Camera, FaceDetector, Uploader } from './service';

const logger = new Logger('App');

async function run() {
  const config = new Config();
  logger.info(`config: ${config.toLogStr()}`);

  const cam = new Camera(config.CAMERA_ID, {
    height: config.CAMERA_HEIGHT,
    width: config.CAMERA_WIDTH,
  });
  const detector = new FaceDetector();
  const uploader = new Uploader(config.UPLOAD_ENDPOINT);

  const sevList = [cam, detector, uploader];
  await Promise.all(sevList.map(s => s.init()));

  logger.info('init done');

  let lastFaceCnt = 0;

  // 循环检测
  while (1) {
    const { mat } = await cam.read();
    await detector.setImg(mat);
    const { count: faceCount } = await detector.detectAllFaces();

    if (lastFaceCnt < faceCount) {
      // 有人进入画面
      logger.info(`somebody into view, ${faceCount - lastFaceCnt}`);
      // 上传
      const timestamp = new Date().valueOf();
      await uploader.upload(timestamp + '.png', mat);
    } else if (lastFaceCnt > faceCount) {
      logger.info(`somebody leave view, ${faceCount - lastFaceCnt}`);
    }

    lastFaceCnt = faceCount;
  }

  await Promise.all(sevList.map(s => s.init()));
}

run().catch(e => {
  logger.error('crashed:' + e);
  process.exit(1);
});
