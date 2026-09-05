import * as firebaseDb from 'firebase/database';

import { Cache, type CacheService } from '@travetto/cache';
import { Inject, Injectable } from '@travetto/di';
import { TimeUtil } from '@travetto/runtime';

import type { Garage } from './garage';

const STARTUP_DELAY = TimeUtil.fromNow('3s').getTime();

function logItem(item: firebaseDb.DataSnapshot) {
  console.log('[Firebase] Received', { key: item.key, value: item.exists() ? item.val().value : null });
}

@Injectable({ autoInject: true })
export class FirebaseListener {
  @Inject()
  store: CacheService;

  @Inject()
  db: firebaseDb.Database;

  @Inject()
  garage: Garage;

  start = Date.now();

  async postConstruct() {
    console.log('[Firebase] Listening');
    const ref = firebaseDb.ref(this.db);
    const query = firebaseDb.query(ref, firebaseDb.orderByKey());
    firebaseDb.onChildAdded(query, item => this.onUpdate(item));
    firebaseDb.onChildChanged(query, item => this.onUpdate(item));
  }

  @Cache('store', 200, { key: (item: firebaseDb.DataSnapshot) => item.key ?? 'unknown' })
  async onUpdate(item: firebaseDb.DataSnapshot): Promise<number> {
    const now = Date.now();
    // Do not process anything in the first N seconds
    if (now < STARTUP_DELAY) {
      return now;
    }

    switch (item.key) {
      case 'Activate': {
        logItem(item);
        if (item.exists()) {
          await this.garage.triggerDoor(item.val().value);
        }
        break;
      }
      case 'Restart': {
        logItem(item);
        if (item.exists() && item.val().value) {
          this.garage.restart();
        }
        break;
      }
    }
    return now;
  }
}
