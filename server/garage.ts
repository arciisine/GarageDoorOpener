import * as http from 'http';
import * as express from 'express';
import * as proc from 'child_process';
import * as rpio from 'rpio';
import { config } from './firebase';
import Storage = require('@google-cloud/storage');

export class Garage {

  static DOOR = 18
  static SNAPSHOT_TIMER: any;
  static SNAPSHOT_LOCK: boolean = false;
  static PATH = 'images/door-snap.jpg';
  static SNAPSHOT_URL = `https://storage.googleapis.com/${config.projectId}/${Garage.PATH}`
  static SNAPHSHOT_PENDING = false;

  static killTimeout: NodeJS.Timer;
  static listening = 0;
  static cameraProc?: proc.ChildProcess = undefined;
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

  static async triggerDoor(action?: string) {
    console.log('[Door] Triggering', action);
    if (this.SNAPSHOT_TIMER) {
      clearTimeout(this.SNAPSHOT_TIMER);
    }
    this.SNAPSHOT_TIMER = setTimeout(() => Garage.exposeSnapshot(), 20000); // Assume stable point after door opens/closes

    rpio.write(this.DOOR, rpio.HIGH);
    rpio.sleep(1)
    rpio.write(this.DOOR, rpio.LOW);
  }

  static cleanup() {
    if (this.cameraProc) {
      console.log('[Camera] Cleanup');
      try {
        this.cameraProc.kill();
      } catch (e) {
        //Do nothing
      }
    }
    process.exit();
  }

  static async startCamera() {
    console.log("[Camera] Starting", this.listening);
    clearTimeout(this.killTimeout);
    if (!this.cameraProc) {
      let args = ['-o', 'output_http.so -w ./www', '-i', 'input_raspicam.so ' + Object.keys(Garage.cameraOptions)
        .map(x => `-${x} ${(Garage.cameraOptions as any)[x]}`).join(' ')];
      let env = {
        LD_LIBRARY_PATH: process.cwd(),
        ...process.env
      };

      this.cameraProc = proc.spawn('mjpg_streamer', args, {
        env,
        cwd: process.cwd(),
        stdio: [null, !process.env.DEBUG ? process.stdout : 'ignore', process.stderr]
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  static async stopCamera() {
    console.log("[Camera] Stopping", this.listening);
    if (this.listening === 0 && this.cameraProc) {
      try {
        this.cameraProc.kill('SIGINT');
      } catch (e) {
        console.log("[Camera] Cannot kill", e.message);
      }
      delete this.cameraProc;
    }
  }

  static async camera(response: NodeJS.WritableStream, action: 'stream' | 'snapshot' = 'stream') {
    let closed = false, close = (type: string, key: string) => {
      console.log("[Camera] Closing", type, key);
      if (closed) {
        return;
      }
      this.listening--;
      closed = true;
      console.log("[Camera] Request End", this.listening);
      this.killTimeout = setTimeout(() => this.stopCamera(), 1000 * 30);
    };

    this.listening++;
    console.log("[Camera] Request Start", this.listening);
    await this.startCamera();

    let req = http.request({
      port: 8080,
      host: 'localhost',
      path: `/?action=${action}`
    }, (res) => {
      if ('writeHead' in response) {
        (response as express.Response).writeHead(res.statusCode || 200, res.headers);
      }
      return res.pipe(response, { end: true });
    });

    response.on('close', (x: any) => close('close', x));
    req.on('error', (x: any) => close('error', x));
    response.on('error', (x: any) => close('error', x));
    response.on('finish', (x: any) => close('finish', x));

    req.end();
  }

  static async exposeSnapshot() {
    if (Garage.SNAPSHOT_LOCK) {
      console.log('[Snapshot] Queued');
      Garage.SNAPHSHOT_PENDING = true;
      return Garage.SNAPSHOT_URL;
    }
    Garage.SNAPSHOT_LOCK = true;
    console.log('[Snapshot] Starting');

    const st = Storage({
      keyFilename: '../google-services.json'
    });

    let bucket = await st.bucket(config.storageBucket.split('gs://')[1]);

    let file = bucket.file(`/${Garage.PATH}`);

    const stream = file.createWriteStream({
      metadata: {
        contentType: 'image/jpeg'
      }
    });

    try {
      let res = await new Promise((resolve, reject) => {
        stream.on('error', reject);
        stream.on('finish', () => {
          file.makePublic()
            .then(x => Garage.SNAPSHOT_URL)
            .then(resolve, reject);
        });
        try {
          Garage.camera(stream, 'snapshot');
        } catch (e) {
          reject(e);
        }
      });

      console.log('[Snapshot] Success');

      return res;
    } catch (e) {
      console.log('[Snapshot] Failed');
    } finally {
      Garage.SNAPSHOT_LOCK = false;
      if (Garage.SNAPHSHOT_PENDING) {
        Garage.SNAPHSHOT_PENDING = false;
        console.log('[Snapshot] Processing queued');
        Garage.exposeSnapshot(); // Handle stalled calls
      }
    }
  }
}