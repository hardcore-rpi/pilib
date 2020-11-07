import { spawn } from 'child_process';
import { Snapshot } from './Snapshot';

export class LiveStream {
  readonly mimeType = 'video/avi';

  constructor(readonly width: number, readonly height: number, readonly frameRate: number) {}

  private get ffmpegArgs() {
    const size = `${this.width}x${this.height}`;

    // -c:v copy -> 直接复制到 avi 容器，不要编码（性能考虑）
    return `-y -f image2pipe -s ${size} -r ${this.frameRate} -i - -an -c:v copy -f avi -`.split(
      ' '
    );
  }

  private ffmpeg = spawn('ffmpeg', this.ffmpegArgs, {
    stdio: ['pipe', 'pipe', process.stderr],
  });

  update(snapshot: Snapshot) {
    const { buf } = snapshot.toBuf();
    this.ffmpeg.stdin.write(buf);
  }

  get output() {
    return this.ffmpeg.stdout;
  }

  dispose() {
    this.ffmpeg.kill('SIGABRT');
  }
}
