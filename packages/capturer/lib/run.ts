#!/usr/bin/env node

import { Config } from './Config';
import { Logger } from './Logger';
import { Camera, FaceDetector, Uploader } from './service';

const logger = new Logger('App');

async function run() {
  const config = new Config();
  logger.info(`config: ${config.toLogStr()}`);

  const cam = new Camera(config.CAMERA_ID, config.CAMERA_NAME, {
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
    try {
      const snapshot = await cam.read();
      await detector.setImg(snapshot.mat);

      const { count: faceCount } = await detector.detectAllFaces();

      if (lastFaceCnt < faceCount) {
        // 有人进入画面，上传
        await uploader.upload(snapshot);
      }

      if (faceCount !== lastFaceCnt) {
        logger.info(`faceCount ${lastFaceCnt} ${faceCount - lastFaceCnt}`);
        lastFaceCnt = faceCount;
      }

      // clean
      snapshot.release();
    } catch (e) {
      logger.error(e.message || e);

      // 重置，并继续执行
      lastFaceCnt = 0;
    }
  }

  await Promise.all(sevList.map(s => s.init()));
}

run().catch(e => {
  logger.error('crashed:' + e);
  process.exit(1);
});
