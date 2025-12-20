import * as fs from 'node:fs';
import * as rpio from 'rpio';

import { Controller, Post, QueryParam } from '@travetto/web';
import { Inject } from '@travetto/di';
import { S3ModelService } from '@travetto/model-s3';

@Controller('/garage')
export class Garage {

  static DOOR_PIN = 18

  lock = false;
  lastUrl: string;

  postConstruct() {
    rpio.open(Garage.DOOR_PIN, rpio.OUTPUT);
  }

  @Inject()
  s3: S3ModelService;

  @Post('/activate')
  async triggerDoor(action?: string) {
    console.log('[Door] Triggering', action);

    rpio.write(Garage.DOOR_PIN, rpio.HIGH);
    rpio.sleep(1)
    rpio.write(Garage.DOOR_PIN, rpio.LOW);

    return { status: 'active' };
  }

  @Post('/snapshot')
  async snapshot(@QueryParam('img') path: string) {
    if (this.lock) {
      console.log('[Snapshot] Skipped');
    } else {

      try {
        console.log('[Snapshot] Starting', { path });
        this.lock = true;
        await this.s3.upsertBlob('/images/door-snap.jpg', fs.createReadStream(path));
        this.lastUrl = await this.s3.getBlobReadUrl('/images/door-snap.jpg', '1h');
        return this.lastUrl;
      } catch (e) {
        console.log('[Snapshot] Failed', e);
      } finally {
        this.lock = false;
      }
    }
    return this.lastUrl;
  }
}