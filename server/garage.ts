import * as http from 'http';
import * as express from 'express';
import * as rpio from 'rpio';
import { config } from './firebase';
import Storage = require('@google-cloud/storage');
import { Raspistill } from 'node-raspistill';

export class Garage {

  static DOOR_GPIO = 18
  static SNAPSHOT_TIMER: any;
  static SNAPSHOT_LOCK: boolean = false;
  static SNAPSHOT_PATH = 'images/door-snap.jpg';
  static SNAPSHOT_URL = `https://storage.googleapis.com/${config.projectId}/${Garage.SNAPSHOT_PATH}`
  static SNAPHSHOT_PENDING = false;
  static SNAPSHOTTER = new Raspistill({
    width: 640,
    height: 480
  });

  static init() {
    rpio.open(this.DOOR_GPIO, rpio.OUTPUT);
    process.on('exit', () => Garage.cleanup());
    process.on('SIGINT', () => Garage.cleanup());
    process.on('uncaughtException', () => Garage.cleanup());
  }

  static async triggerDoor(action?: string) {
    console.log('[Door] Triggering', action);

    if (this.SNAPSHOT_TIMER) {
      clearTimeout(this.SNAPSHOT_TIMER);
    }

    // Assume stable point after door opens/closes
    this.SNAPSHOT_TIMER = setTimeout(() => this.SNAPSHOT_TIMER = undefined, 20000);
    //Start chain
    this.exposeSnapshot();

    rpio.write(this.DOOR_GPIO, rpio.HIGH);
    rpio.sleep(1)
    rpio.write(this.DOOR_GPIO, rpio.LOW);
  }

  static cleanup() {
    process.exit();
  }

  static async camera(response: NodeJS.WritableStream) {
    console.log("[Camera] Snapshot");
    let buffer = await Garage.SNAPSHOTTER.takePhoto();
    if ('writeHead' in response) {
      (response as express.Response).writeHead(200, {
        'Content-Type': 'image/jpeg'
      });
    }
    response.write(buffer);
    response.end();
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

    let file = bucket.file(`/${Garage.SNAPSHOT_PATH}`);

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
          Garage.camera(stream);
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
      if (Garage.SNAPHSHOT_PENDING || Garage.SNAPSHOT_TIMER !== undefined) {
        console.log('[Snapshot] Processing ' + (Garage.SNAPHSHOT_PENDING ? 'pending' : 'scheduled'));
        Garage.SNAPHSHOT_PENDING = false;
        setTimeout(() => Garage.exposeSnapshot(), Garage.SNAPSHOT_TIMER === undefined ? 0 : 2000); // Handle stalled calls
      }
    }
  }
}