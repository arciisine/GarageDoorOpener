import * as rpio from 'rpio';
import * as http from 'http';
import * as express from 'express';
import * as proc from 'child_process';

export class Pi {

  static DOOR = 18

  static killTimeout;
  static listening = 0;
  static cameraProc: proc.ChildProcess = undefined;
  static cameraOptions = {
    x: 1280,
    y: 720,
    fps: 24
  }

  static init() {
    rpio.open(this.DOOR, rpio.OUTPUT);

    process.on('exit', () => Pi.cleanup());
    process.on('SIGINT', () => Pi.cleanup());
    process.on('uncaughtException', () => Pi.cleanup());
  }

  static async triggerDoor() {
    rpio.write(this.DOOR, rpio.HIGH);
    rpio.sleep(.5)
    rpio.write(this.DOOR, rpio.LOW);
  }

  static cleanup() {
    if (this.cameraProc) {
      try {
        this.cameraProc.kill();
      } catch (e) {
        //Do nothing
      }
    }
    process.exit();
  }

  static async startCamera() {
    clearTimeout(this.killTimeout);
    if (!this.cameraProc) {
      let args = ['-o', 'output_http.so -w ./www', '-i', 'input_raspicam.so ' + Object.keys(Pi.cameraOptions).map(x => `-${x} ${Pi.cameraOptions[x]}`).join(' ')];
      let env = {
        LD_LIBRARY_PATH: process.cwd(),
        ...process.env
      };

      this.cameraProc = proc.spawn('mjpg_streamer', args, {
        env,
        cwd: process.cwd()
      });
      this.cameraProc.stdout.pipe(process.stdout);
      this.cameraProc.stderr.pipe(process.stderr);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  static async stopCamera() {
    if (this.listening === 0 && this.cameraProc) {
      try {
        this.cameraProc.kill('SIGINT');
      } catch (e) {
        console.log("Cannot kill", e.message);
      }
      delete this.cameraProc;
    }
  }

  static async camera(request: express.Request, response: express.Response, stream: boolean = true) {
    let req = http.request({
      port: 8080,
      host: 'localhost',
      path: `/?action=${stream ? 'stream' : 'snapshot'}`
    }, (res) => {
      response.writeHead(res.statusCode, res.headers);
      return res.pipe(response, { end: true });
    });

    this.listening++;
    this.startCamera();
    let closed = false, close = () => {
      if (closed) {
        return;
      }
      this.listening--;
      closed = true;
      this.killTimeout = setTimeout(() => this.stopCamera(), 1000 * 60 * 5);
    }
    req.on('close', close);
    req.on('error', close);
    req.on('finish', close);

    req.end();
  }
}