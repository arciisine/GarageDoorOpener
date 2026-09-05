import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import * as firebaseDb from 'firebase/database';
import onoff from 'onoff';

import { Inject } from '@travetto/di';
import type { S3ModelService } from '@travetto/model-s3';
import { Util } from '@travetto/runtime';
import { Controller, Post, QueryParam } from '@travetto/web';

@Controller('/garage')
export class Garage {
  static DOOR_PIN = 515;

  lock = 0;
  lastUrl: string;

  pin = new onoff.Gpio(Garage.DOOR_PIN, 'high');

  @Inject()
  s3: S3ModelService;

  @Inject()
  db: firebaseDb.Database;

  @Post('/activate')
  async triggerDoor(action?: string) {
    console.log('[Door] Triggering', action);

    await this.pin.write(0);
    await Util.nonBlockingTimeout(1500);
    await this.pin.write(1);

    return { status: 'active' };
  }

  @Post('/restart')
  async restart() {
    await firebaseDb.remove(firebaseDb.ref(this.db, '/Restart'));
    process.exit(200);
  }

  @Post('/snapshot')
  async snapshot(@QueryParam() img: string) {
    if (this.lock && Date.now() - this.lock < 10000) {
      // Only let lock last 10 seconds
      console.log('[Snapshot] Skipped');
    } else {
      try {
        this.lock = Date.now();
        console.log('[Snapshot] Starting', { img });
        const pathName = `/images/${path.basename(img)}`;
        await this.s3.upsertBlob(pathName, createReadStream(img));
        this.lastUrl = await this.s3.getBlobReadUrl(pathName, '1h');
        const ref = firebaseDb.ref(this.db, '/Image');
        firebaseDb.set(ref, this.lastUrl);
      } catch (e) {
        console.log('[Snapshot] Failed', e);
      } finally {
        await fs.unlink(img).catch(() => {});
        this.lock = 0;
      }
    }
    return this.lastUrl;
  }
}
