import * as http from 'http';
import * as express from 'express';
import * as fs from 'fs';
import { config } from './firebase';
import Storage = require('@google-cloud/storage');

let rpio: Rpio;

try {
  rpio = require('rpio');
} catch (e) {

}

export class Garage {

  static DOOR_GPIO = 18
  static SNAPSHOT_LOCK = false;
  static SNAPSHOT_PATH = 'images/door-snap.jpg';
  static SNAPSHOT_URL = `https://storage.googleapis.com/${config.projectId}/${Garage.SNAPSHOT_PATH}`

  static init() {
    if (rpio) {
      rpio.open(Garage.DOOR_GPIO, rpio.OUTPUT);
    }
    process.on('exit', () => Garage.cleanup());
    process.on('SIGINT', () => Garage.cleanup());
    process.on('uncaughtException', () => Garage.cleanup());
  }

  static async triggerDoor(action?: string) {
    console.log('[Door] Triggering', action);

    if (rpio) {
      rpio.write(Garage.DOOR_GPIO, rpio.HIGH);
      rpio.sleep(1)
      rpio.write(Garage.DOOR_GPIO, rpio.LOW);
    }
  }

  static cleanup() {
    process.exit();
  }

  static async snapshot(path: string) {
    if (Garage.SNAPSHOT_LOCK) {
      console.log('[Snapshot] Skipped');
      return Garage.SNAPSHOT_URL;
    }
    Garage.SNAPSHOT_LOCK = true;
    console.log('[Snapshot] Starting ' + path);

    const st = Storage({
      keyFilename: '../google-services.json'
    });

    let bucket = await st.bucket(config.storageBucket.split('gs://')[1]);

    let file = bucket.file(`/${Garage.SNAPSHOT_PATH}`);

    const stream = file.createWriteStream({
      validation: 'md5',
      resumable: false,
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
          fs.createReadStream(path).pipe(stream).on('error', reject);
        } catch (e) {
          reject(e);
        }
      });

      console.log('[Snapshot] Success ' + JSON.stringify(res));

      return res;
    } catch (e) {
      console.log('[Snapshot] Failed', e);
    } finally {
      Garage.SNAPSHOT_LOCK = false;
    }
  }
}