import fs from 'node:fs';
import path from 'node:path';
import onoff from 'onoff';

import { Controller, Post, QueryParam } from '@travetto/web';
import { Inject } from '@travetto/di';
import { S3ModelService } from '@travetto/model-s3';
import * as firebaseDb from 'firebase/database';
import { Util } from '@travetto/runtime';

@Controller('/garage')
export class Garage {

  static DOOR_PIN = 515;

  lock = false;
  lastUrl: string;

  pin = new onoff.Gpio(Garage.DOOR_PIN, 'out');

  @Inject()
  s3: S3ModelService;

  @Inject()
  db: firebaseDb.Database

  @Post('/activate')
  async triggerDoor(action?: string) {
    console.log('[Door] Triggering', action);

    await this.pin.write(1);
    await Util.nonBlockingTimeout(1000);
    await this.pin.write(0);

    return { status: 'active' };
  }

  @Post('/snapshot')
  async snapshot(@QueryParam() img: string) {
    if (this.lock) {
      console.log('[Snapshot] Skipped');
    } else {

      try {
        console.log('[Snapshot] Starting', { img });
        this.lock = true;
        const pathName = `/images/${path.basename(img)}.${path.extname(img)}`;
        await this.s3.upsertBlob(pathName, fs.createReadStream(img));
        this.lastUrl = await this.s3.getBlobReadUrl(pathName, '1h');
        const ref = firebaseDb.ref(this.db, '/Image');
        firebaseDb.set(ref, this.lastUrl);
      } catch (e) {
        console.log('[Snapshot] Failed', e);
      } finally {
        this.lock = false;
      }

      return this.lastUrl;
    }
  }
}