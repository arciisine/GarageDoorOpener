import * as rpio from 'rpio';
import * as http from 'http';
import * as express from 'express';
import * as proc from 'child_process';

export class Garage {

  static DOOR = 18

  static killTimeout;
  static listening = 0;
  static cameraProc: proc.ChildProcess = undefined;
  static cameraOptions = {
    x: 640,
    y: 480,
    fps: 15
  }

  static init() {
    rpio.open(this.DOOR, rpio.OUTPUT);

    process.on('exit', () => Garage.cleanup());
    process.on('SIGINT', () => Garage.cleanup());
    process.on('uncaughtException', () => Garage.cleanup());
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
    console.log("Starting Camera", this.listening);
    clearTimeout(this.killTimeout);
    if (!this.cameraProc) {
      let args = ['-o', 'output_http.so -w ./www', '-i', 'input_raspicam.so ' + Object.keys(Garage.cameraOptions).map(x => `-${x} ${Garage.cameraOptions[x]}`).join(' ')];
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
    console.log("Stopping Camera", this.listening);
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
    let closed = false, close = (type, key) => {
      console.log("Closing", type, key);
      if (closed) {
        return;
      }
      this.listening--;
      closed = true;
      console.log("Camera Request End", this.listening);
      this.killTimeout = setTimeout(() => this.stopCamera(), 1000 * 30);
    };

    let req = http.request({
      port: 8080,
      host: 'localhost',
      path: `/?action=${stream ? 'stream' : 'snapshot'}`
    }, (res) => {
      response.writeHead(res.statusCode, res.headers);
      return res.pipe(response, { end: true });
    });

    this.listening++;
    console.log("Camera Request Start", this.listening);
    this.startCamera();

    response.on('close', x => close('close', x));
    req.on('error', x => close('error', x));
    response.on('error', x => close('error', x));
    response.on('finish', x => close('finish', x));

    req.end();
  }
}