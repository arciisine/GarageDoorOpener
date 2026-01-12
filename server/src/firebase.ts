import * as firebase from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import * as firebaseDb from 'firebase/database';

import { Inject, Injectable, InjectableFactory } from '@travetto/di';
import { Cache, CacheModelSymbol, type CacheService } from '@travetto/cache';
import { RuntimeResources, TimeUtil } from '@travetto/runtime';
import { MemoryModelConfig, MemoryModelService } from '@travetto/model-memory';

import { Garage } from './garage';

const STARTUP_DELAY = TimeUtil.asMillis('3s')

class GetFirebaseDb {
  @InjectableFactory()
  static async getDb(): Promise<firebaseDb.Database> {
    const conf = JSON.parse(await RuntimeResources.read('firebase-config.json'));
    const app = firebase.initializeApp(conf);
    const auth = firebaseAuth.getAuth(app);
    const db = firebaseDb.getDatabase(app);
    firebaseAuth.signInAnonymously(auth);
    return db;
  }
  @InjectableFactory(CacheModelSymbol)
  static getModel(config: MemoryModelConfig) {
    return new MemoryModelService(config);
  }
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
    console.log('[Firebase] Received', { key: item.key, value: (item.exists() ? item.val().value : null) });
    if ((now - this.start) >= STARTUP_DELAY && item && item.key === 'Activate' && item.exists()) {
      await this.garage.triggerDoor(item.val().value);
    }
    return now;
  }
}